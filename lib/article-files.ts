import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./i18n";
import { IMAGE_FILE_RE, detectImageType } from "./images";
import { SLUG_RE, type ArticleInput } from "./new-article";

/** 某一语言版本的文件名：vpn.md（默认语言）、vpn.zh.md */
export function articleFileName(slug: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? `${slug}.md` : `${slug}.${locale}.md`;
}

/** 同一 slug 各语言版本的文件名 */
function fileNames(slug: string): string[] {
  return LOCALES.map((l) => articleFileName(slug, l));
}

export function slugExists(dir: string, slug: string): boolean {
  return fileNames(slug).some((f) => existsSync(path.join(dir, f)));
}

export type WriteResult = { ok: true } | { ok: false; reason: "exists" } | { ok: false; reason: "failed"; message: string };

/** 新建默认语言版本；wx 标志保证即使检查后被抢先创建也不会覆盖 */
export async function writeNewArticle(dir: string, slug: string, content: string): Promise<WriteResult> {
  if (!SLUG_RE.test(slug)) throw new Error(`invalid slug: ${slug}`);
  if (slugExists(dir, slug)) return { ok: false, reason: "exists" };
  try {
    await writeFile(path.join(dir, `${slug}.md`), content, { encoding: "utf8", flag: "wx" });
    return { ok: true };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "EEXIST") return { ok: false, reason: "exists" };
    return { ok: false, reason: "failed", message: err.message };
  }
}

/** 文件内容的指纹：编辑页打开时记录，保存时比对，防止覆盖期间被他人改过的文件 */
export function contentHash(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** 读取某一语言版本的原文；不存在时返回 null */
export async function readArticleFile(dir: string, slug: string, locale: Locale): Promise<{ raw: string; hash: string } | null> {
  if (!SLUG_RE.test(slug)) return null;
  try {
    const raw = await readFile(path.join(dir, articleFileName(slug, locale)), "utf8");
    return { raw, hash: contentHash(raw) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/** 把文章原文拆回表单字段（slug 由文件名决定，不在其中） */
export function parseArticleMarkdown(raw: string): Omit<ArticleInput, "slug"> {
  const { data, content } = matter(raw);
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  // YAML 会把未加引号的 2026-01-01 解析成 UTC 零点的 Date
  const updated = data.updated instanceof Date && !Number.isNaN(data.updated.getTime()) ? data.updated.toISOString().slice(0, 10) : text(data.updated);
  return {
    title: text(data.title),
    summary: text(data.summary),
    category: text(data.category),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    updated,
    body: content.replace(/\r\n?/g, "\n").replace(/^\n+/, ""),
  };
}

export type OverwriteResult =
  | { ok: true }
  | { ok: false; reason: "notFound" | "conflict" }
  | { ok: false; reason: "failed"; message: string };

/** 覆盖已有的语言版本；文件内容与 expectedHash 不一致时拒绝写入 */
export async function overwriteArticle(dir: string, slug: string, locale: Locale, content: string, expectedHash: string): Promise<OverwriteResult> {
  if (!SLUG_RE.test(slug)) throw new Error(`invalid slug: ${slug}`);
  const file = path.join(dir, articleFileName(slug, locale));
  try {
    const current = await readFile(file, "utf8");
    if (contentHash(current) !== expectedHash) return { ok: false, reason: "conflict" };
    await writeFile(file, content, "utf8");
    return { ok: true };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { ok: false, reason: "notFound" };
    return { ok: false, reason: "failed", message: err.message };
  }
}

export type ImageWriteResult =
  | { ok: true; file: string }
  | { ok: false; reason: "unsupportedType" }
  | { ok: false; reason: "failed"; message: string };

/**
 * 按内容哈希命名保存图片；同一张图重复上传得到同一个文件，不会覆盖其他图片。
 * 目录不存在时自动创建（仓库里原本没有 content/images/）
 */
export async function writeImage(dir: string, bytes: Uint8Array): Promise<ImageWriteResult> {
  const ext = detectImageType(bytes);
  if (!ext) return { ok: false, reason: "unsupportedType" };
  const file = `${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}.${ext}`;
  if (!IMAGE_FILE_RE.test(file)) throw new Error(`invalid image file name: ${file}`);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, file), bytes, { flag: "wx" });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") return { ok: false, reason: "failed", message: err.message };
  }
  return { ok: true, file };
}
