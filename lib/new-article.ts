/** 新建文章（/new）的纯逻辑：不依赖文件系统，可在服务端与客户端共用 */

import yaml from "js-yaml";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export const BODY_TEMPLATE = "## 1. First steps\n\n- [ ] \n- [ ] \n";

/** 仅在 npm run dev 下开放写入；next build 会把判断内联为常量 */
export function isAuthoringEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

/** 标题 → 文件名；非英文字母数字的部分合并为短横线，纯中文标题返回空字符串 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 文件名冲突时依次尝试 slug-2、slug-3… */
export function suggestSlug(slug: string, exists: (candidate: string) => boolean): string {
  for (let n = 2; ; n++) {
    const candidate = `${slug}-${n}`;
    if (!exists(candidate)) return candidate;
  }
}

export function formatLocalDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 新建文章表单的字段 */
export interface ArticleInput {
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  updated: string;
  body: string;
}

function parsesTo(source: string, expected: unknown): boolean {
  try {
    return JSON.stringify(yaml.load(source)) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

/**
 * 可以不加引号的值：以字母或数字开头，只含字母、数字、空格和少数安全标点。
 * 站点用 gray-matter 自带的旧版 js-yaml（YAML 1.1）解析，它会把 12:30、1_000 读成数字，
 * 因此冒号、下划线等一律加引号，而不是只信任本项目的 js-yaml 4。
 */
const SAFE_PLAIN_RE = /^[\p{L}\p{N}][\p{L}\p{N} .()/'&+-]*$/u;

/** 安全且能被 YAML 读回同一字符串时不加引号，否则用双引号（JSON 字符串即合法的 YAML 双引号标量） */
function scalar(value: string): string {
  return SAFE_PLAIN_RE.test(value) && parsesTo(`k: ${value}`, { k: value }) ? value : JSON.stringify(value);
}

function flowItem(value: string): string {
  return SAFE_PLAIN_RE.test(value) && parsesTo(`[${value}]`, [value]) ? value : JSON.stringify(value);
}

/** 生成文章全文；字段顺序与现有文章一致 */
export function buildArticleMarkdown(article: ArticleInput): string {
  const head =
    [
      "---",
      `title: ${scalar(article.title)}`,
      `summary: ${scalar(article.summary)}`,
      `category: ${scalar(article.category)}`,
      `tags: [${article.tags.map(flowItem).join(", ")}]`,
      `updated: ${article.updated}`,
      "---",
    ].join("\n") + "\n";
  const body = article.body.replace(/\r\n?/g, "\n").replace(/^\n+/, "").replace(/\s+$/, "");
  return body ? `${head}\n${body}\n` : head;
}

export type ArticleField = keyof ArticleInput;
export type FieldError = "required" | "invalidSlug" | "unknownCategory" | "invalidDate" | "exists";
export type FieldErrors = Partial<Record<ArticleField, FieldError>>;
export type ValidationResult = { ok: true; value: ArticleInput } | { ok: false; fieldErrors: FieldErrors };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** 来自客户端的数据不可信：类型不对的字段按空值处理 */
function normalize(raw: unknown): ArticleInput {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const tags: string[] = [];
  for (const t of Array.isArray(r.tags) ? r.tags : []) {
    const v = str(t).trim();
    if (v && !tags.includes(v)) tags.push(v);
  }
  return {
    title: str(r.title).trim(),
    slug: str(r.slug).trim(),
    summary: str(r.summary).replace(/\s*\r?\n\s*/g, " ").trim(),
    category: str(r.category).trim(),
    tags,
    updated: str(r.updated).trim(),
    body: str(r.body).replace(/\r\n?/g, "\n"),
  };
}

export function validateArticleInput(raw: unknown, categoryIds: readonly string[]): ValidationResult {
  const value = normalize(raw);
  const fieldErrors: FieldErrors = {};
  if (!value.title) fieldErrors.title = "required";
  if (!value.slug) fieldErrors.slug = "required";
  else if (!SLUG_RE.test(value.slug)) fieldErrors.slug = "invalidSlug";
  if (!value.summary) fieldErrors.summary = "required";
  if (!value.category) fieldErrors.category = "required";
  else if (!categoryIds.includes(value.category)) fieldErrors.category = "unknownCategory";
  if (!value.updated) fieldErrors.updated = "required";
  else if (!isValidDate(value.updated)) fieldErrors.updated = "invalidDate";
  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: true, value };
}
