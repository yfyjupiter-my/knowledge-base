import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LOCALE, LOCALES } from "./i18n";
import { IMAGE_FILE_RE, detectImageType } from "./images";
import { SLUG_RE } from "./new-article";

/** 同一 slug 各语言版本的文件名：vpn.md（默认语言）、vpn.zh.md */
function fileNames(slug: string): string[] {
  return LOCALES.map((l) => (l === DEFAULT_LOCALE ? `${slug}.md` : `${slug}.${l}.md`));
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
