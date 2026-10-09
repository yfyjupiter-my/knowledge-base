import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LOCALE, LOCALES } from "./i18n";
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
