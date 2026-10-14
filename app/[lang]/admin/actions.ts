"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { slugExists, writeNewArticle } from "@/lib/article-files";
import { ARTICLES_DIR } from "@/lib/articles";
import { getCategories } from "@/lib/categories.server";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n";
import { SLUG_RE, buildArticleMarkdown, isAuthoringEnabled, isLocalHost, suggestSlug, validateArticleInput, type FieldErrors } from "@/lib/new-article";

export type CreateArticleState = {
  fieldErrors?: FieldErrors;
  /** requestFailed 由客户端在请求本身失败时设置 */
  formError?: "disabled" | "forbiddenHost" | "requestFailed" | "writeFailed";
  detail?: string;
  suggestion?: string;
  /** 成功时新文章的地址，由客户端整页跳转 */
  href?: string;
};

/** 只允许在本机通过 localhost / 127.0.0.1 / [::1] 访问时写入 */
async function requestIsLocal(): Promise<boolean> {
  return isLocalHost((await headers()).get("host"));
}

function suggestionFor(slug: string): string {
  return suggestSlug(slug, (s) => slugExists(ARTICLES_DIR, s));
}

/**
 * 校验并写入新文章；成功时返回文章地址，失败时返回错误供表单展示。
 * 不在此处 redirect：dev 模式下写入文件会触发重新编译，与客户端路由跳转竞争，导致跳转丢失。
 */
export async function createArticle(lang: string, raw: unknown): Promise<CreateArticleState> {
  if (!isAuthoringEnabled()) return { formError: "disabled" };
  if (!(await requestIsLocal())) return { formError: "forbiddenHost" };
  const result = validateArticleInput(raw, getCategories().map((c) => c.id));
  if (!result.ok) return { fieldErrors: result.fieldErrors };

  const { value } = result;
  const written = await writeNewArticle(ARTICLES_DIR, value.slug, buildArticleMarkdown(value));
  if (!written.ok) {
    if (written.reason === "exists") return { fieldErrors: { slug: "exists" }, suggestion: suggestionFor(value.slug) };
    return { formError: "writeFailed", detail: written.message };
  }
  // 生产模式（Docker）下首页、侧栏与搜索索引有 60 秒缓存，立即刷新以包含新文章
  revalidatePath("/[lang]", "layout");
  return { href: localePath(isLocale(lang) ? lang : DEFAULT_LOCALE, `/articles/${value.slug}`) };
}

/** 输入文件名时实时检查是否已被占用 */
export async function checkSlug(slug: string): Promise<{ exists: boolean; suggestion?: string }> {
  if (!isAuthoringEnabled() || !(await requestIsLocal()) || typeof slug !== "string" || !SLUG_RE.test(slug)) return { exists: false };
  if (!slugExists(ARTICLES_DIR, slug)) return { exists: false };
  return { exists: true, suggestion: suggestionFor(slug) };
}
