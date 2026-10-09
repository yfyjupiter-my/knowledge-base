/** 新建文章（/new）的纯逻辑：不依赖文件系统，可在服务端与客户端共用 */

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
