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

/** 原样写入能被 YAML 读回同一字符串时不加引号，否则用双引号（JSON 字符串即合法的 YAML 双引号标量） */
function scalar(value: string): string {
  return value !== "" && parsesTo(`k: ${value}`, { k: value }) ? value : JSON.stringify(value);
}

function flowItem(value: string): string {
  return value !== "" && parsesTo(`[${value}]`, [value]) ? value : JSON.stringify(value);
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
