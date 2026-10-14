import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import { OTHER_ID, resolveCategory, type CategoryId } from "./categories";
import { getCategories } from "./categories.server";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./i18n";

export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
/** /admin 上传的图片，经 /media/<文件名> 对外提供 */
export const IMAGES_DIR = path.join(process.cwd(), "content", "images");

export interface ArticleMeta {
  slug: string;
  title: string;
  summary: string;
  category: CategoryId;
  tags: string[];
  /** YYYY-MM-DD */
  updated: string;
  readingMinutes: number;
  /** 文中排查清单（- [ ]）的步骤数 */
  stepCount: number;
  /** 正文实际使用的语言 */
  contentLocale: Locale;
  /** 请求的语言没有译文，回退显示了另一种语言 */
  fallback: boolean;
}

export interface Heading {
  id: string;
  text: string;
}

export interface Article extends ArticleMeta {
  content: string;
  headings: Heading[];
}

/** 提供给客户端 Fuse.js 的检索文档 */
export interface SearchDoc extends ArticleMeta {
  body: string;
}

const TASK_RE = /^\s*[-*+]\s+\[[ xX]\]\s/;
const FENCE_RE = /^\s*(```|~~~)/;

function formatDate(value: unknown, fallback: Date): string {
  // YAML 会把未加引号的 2026-01-01 解析成 Date
  const d = value instanceof Date ? value : typeof value === "string" ? new Date(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback.toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

/** 逐行扫描（跳过代码块）提取步骤数与二级标题；标题 id 与 rehype-slug 的生成规则一致 */
function analyse(content: string) {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let stepCount = 0;
  let inFence = false;
  for (const line of content.split(/\r?\n/)) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (TASK_RE.test(line)) stepCount++;
    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      const text = stripInline(h[2]);
      const id = slugger.slug(text);
      if (h[1].length === 2) headings.push({ id, text });
    }
  }
  return { headings, stepCount };
}

/** 粗略去除 Markdown 语法，得到用于全文检索的纯文本（保留代码内容，方便搜错误码） */
function toPlainText(content: string): string {
  return stripInline(
    content
      .replace(/^\s*(```|~~~).*$/gm, " ")
      .replace(/^\s*>\s*\[!\w+\]/gm, " ")
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s/gm, " ")
      .replace(/^[#>\-*+|\s]+/gm, " ")
      .replace(/\|/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function parseFile(file: string, slug: string, contentLocale: Locale, requested: Locale): Article {
  const fullPath = path.join(ARTICLES_DIR, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const { headings, stepCount } = analyse(content);
  const plain = toPlainText(content);
  // 中文约 400 字/分钟，英文约 200 词/分钟
  const minutes = contentLocale === "en" ? plain.split(/\s+/).length / 200 : plain.length / 400;

  return {
    slug,
    title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : slug,
    summary: typeof data.summary === "string" ? data.summary.trim() : "",
    category: resolveCategory(data.category, getCategories()).id,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    updated: formatDate(data.updated, fs.statSync(fullPath).mtime),
    readingMinutes: Math.max(1, Math.round(minutes)),
    stepCount,
    contentLocale,
    fallback: contentLocale !== requested,
    content,
    headings,
  };
}

const TRANSLATED = LOCALES.filter((l) => l !== DEFAULT_LOCALE);
// vpn.md → 默认语言（英文）；vpn.zh.md → 中文
const FILE_RE = new RegExp(`^(.+?)(?:\\.(${TRANSLATED.join("|")}))?\\.md$`, "i");

/** 按 slug 分组：{ slug → { en: "vpn.md", zh: "vpn.zh.md" } } */
function listFiles(): Map<string, Partial<Record<Locale, string>>> {
  const groups = new Map<string, Partial<Record<Locale, string>>>();
  if (!fs.existsSync(ARTICLES_DIR)) return groups;
  for (const file of fs.readdirSync(ARTICLES_DIR)) {
    if (file.startsWith("_")) continue;
    const m = FILE_RE.exec(file);
    if (!m) continue;
    const locale = (m[2]?.toLowerCase() as Locale | undefined) ?? DEFAULT_LOCALE;
    const group = groups.get(m[1]) ?? {};
    group[locale] = file;
    groups.set(m[1], group);
  }
  return groups;
}

/** 优先使用请求语言的版本，没有译文时回退到另一种语言 */
export const getAllArticles = cache((locale: Locale): Article[] =>
  [...listFiles()]
    .map(([slug, files]) => {
      const contentLocale = files[locale] ? locale : files[DEFAULT_LOCALE] ? DEFAULT_LOCALE : (Object.keys(files)[0] as Locale);
      return parseFile(files[contentLocale]!, slug, contentLocale, locale);
    })
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title, locale === "zh" ? "zh-CN" : "en")),
);

/** slug 只与目录中真实存在的文件匹配，不会拼接任意路径 */
export const getArticle = cache((locale: Locale, slug: string): Article | null => {
  const decoded = decodeURIComponent(slug);
  return getAllArticles(locale).find((a) => a.slug === decoded) ?? null;
});

/** 左侧目录树的节点：只带导航需要的字段，避免把正文传给客户端 */
export interface TreeArticle extends Pick<ArticleMeta, "slug" | "title" | "tags" | "updated" | "contentLocale"> {
  headings: Heading[];
}

export interface TreeCategory {
  id: CategoryId;
  articles: TreeArticle[];
}

/** 按 categories.yml 的顺序分组（未归类的排在最后），组内按标题排序 */
export function getArticleTree(locale: Locale): TreeCategory[] {
  const all = getAllArticles(locale);
  const order: CategoryId[] = [...getCategories().map((c) => c.id), OTHER_ID];
  return order
    .map((id) => ({
      id,
      articles: all
        .filter((a) => a.category === id)
        .sort((a, b) => a.title.localeCompare(b.title, locale === "zh" ? "zh-CN" : "en"))
        .map(({ slug, title, tags, updated, contentLocale, headings }) => ({ slug, title, tags, updated, contentLocale, headings })),
    }))
    // 新建的分类即使还没有文章也显示，"其他"只在有文章时显示
    .filter((c) => c.id !== OTHER_ID || c.articles.length > 0);
}

export function getSearchDocs(locale: Locale): SearchDoc[] {
  return getAllArticles(locale).map(({ content, headings: _headings, ...meta }) => ({
    ...meta,
    body: toPlainText(content),
  }));
}
