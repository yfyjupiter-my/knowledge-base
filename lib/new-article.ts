/** 新建文章（/admin）的纯逻辑：不依赖文件系统，可在服务端与客户端共用 */

import matter from "gray-matter";
import yaml from "js-yaml";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export const BODY_TEMPLATE = "## 1. First steps\n\n- [ ] \n- [ ] \n";

/** 仅在 npm run dev 或设置 KB_AUTHORING=1（本机 Docker）时开放写入 */
export function isAuthoringEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.KB_AUTHORING === "1";
}

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/**
 * 写入只接受浏览器以本机地址访问的请求：浏览器无法伪造 Host，
 * 可挡住 DNS rebinding（恶意网页把自己的域名解析到 127.0.0.1 后调用 Server Action）
 */
export function isLocalHost(host: string | null): boolean {
  return host !== null && LOCAL_HOST_RE.test(host);
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

/**
 * gray-matter 默认会把 ---js / ---javascript 块当作代码执行。导入的文件来自用户选择，
 * 不可信，因此这两种引擎一律忽略（返回空对象），只保留 YAML 解析。
 */
const NO_SCRIPT_ENGINE = () => ({});

/** 把文章原文拆回表单字段（slug 由文件名决定，不在其中）；导入 Markdown 与编辑已有文章共用 */
export function parseArticleMarkdown(raw: string): Omit<ArticleInput, "slug"> {
  const { data, content } = matter(raw, { engines: { js: NO_SCRIPT_ENGINE, javascript: NO_SCRIPT_ENGINE } });
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
