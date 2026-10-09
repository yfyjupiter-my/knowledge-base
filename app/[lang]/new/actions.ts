"use server";

import { slugExists, writeNewArticle } from "@/lib/article-files";
import { ARTICLES_DIR } from "@/lib/articles";
import { getCategories } from "@/lib/categories.server";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n";
import { SLUG_RE, buildArticleMarkdown, isAuthoringEnabled, suggestSlug, validateArticleInput, type FieldErrors } from "@/lib/new-article";

export type CreateArticleState = {
  fieldErrors?: FieldErrors;
  formError?: "disabled" | "writeFailed";
  detail?: string;
  suggestion?: string;
  /** 成功时新文章的地址，由客户端整页跳转 */
  href?: string;
};

function suggestionFor(slug: string): string {
  return suggestSlug(slug, (s) => slugExists(ARTICLES_DIR, s));
}

/**
 * 校验并写入新文章；成功时返回文章地址，失败时返回错误供表单展示。
 * 不在此处 redirect：dev 模式下写入文件会触发重新编译，与客户端路由跳转竞争，导致跳转丢失。
 */
export async function createArticle(lang: string, raw: unknown): Promise<CreateArticleState> {
  if (!isAuthoringEnabled()) return { formError: "disabled" };
  const result = validateArticleInput(raw, getCategories().map((c) => c.id));
  if (!result.ok) return { fieldErrors: result.fieldErrors };

  const { value } = result;
  const written = await writeNewArticle(ARTICLES_DIR, value.slug, buildArticleMarkdown(value));
  if (!written.ok) {
    if (written.reason === "exists") return { fieldErrors: { slug: "exists" }, suggestion: suggestionFor(value.slug) };
    return { formError: "writeFailed", detail: written.message };
  }
  return { href: localePath(isLocale(lang) ? lang : DEFAULT_LOCALE, `/articles/${value.slug}`) };
}

/** 输入文件名时实时检查是否已被占用 */
export async function checkSlug(slug: string): Promise<{ exists: boolean; suggestion?: string }> {
  if (!isAuthoringEnabled() || typeof slug !== "string" || !SLUG_RE.test(slug)) return { exists: false };
  if (!slugExists(ARTICLES_DIR, slug)) return { exists: false };
  return { exists: true, suggestion: suggestionFor(slug) };
}
