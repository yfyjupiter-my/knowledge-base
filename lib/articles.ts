import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import { resolveCategory, type CategoryId } from "./categories";

export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

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

function parseFile(file: string): Article {
  const fullPath = path.join(ARTICLES_DIR, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const slug = file.replace(/\.md$/i, "");
  const { headings, stepCount } = analyse(content);
  const plainLength = toPlainText(content).length;

  return {
    slug,
    title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : slug,
    summary: typeof data.summary === "string" ? data.summary.trim() : "",
    category: resolveCategory(data.category).id,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    updated: formatDate(data.updated, fs.statSync(fullPath).mtime),
    // 中文阅读速度约 400 字/分钟
    readingMinutes: Math.max(1, Math.round(plainLength / 400)),
    stepCount,
    content,
    headings,
  };
}

function listFiles(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs.readdirSync(ARTICLES_DIR).filter((f) => f.toLowerCase().endsWith(".md") && !f.startsWith("_"));
}

export const getAllArticles = cache((): Article[] =>
  listFiles()
    .map(parseFile)
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title, "zh-CN")),
);

/** slug 只与目录中真实存在的文件匹配，不会拼接任意路径 */
export const getArticle = cache((slug: string): Article | null => {
  const decoded = decodeURIComponent(slug);
  return getAllArticles().find((a) => a.slug === decoded) ?? null;
});

export function getSearchDocs(): SearchDoc[] {
  return getAllArticles().map(({ content, headings: _headings, ...meta }) => ({
    ...meta,
    body: toPlainText(content),
  }));
}
