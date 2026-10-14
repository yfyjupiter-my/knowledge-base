/** /admin 上传图片的纯逻辑：不依赖文件系统，可在服务端与客户端共用 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 图片对外地址前缀，由 app/media/[file]/route.ts 从 content/images/ 读取 */
export const MEDIA_PREFIX = "/media/";

export const IMAGE_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
} as const;

export type ImageExt = keyof typeof IMAGE_TYPES;

/** 保存后的文件名：内容哈希 + 扩展名；路由只接受这种格式，杜绝路径穿越 */
export const IMAGE_FILE_RE = /^[a-f0-9]{16}\.(png|jpg|gif|webp)$/;

/**
 * 按文件头判断真实格式，不信任浏览器给出的 MIME 和扩展名；
 * 不支持 SVG：它可以携带脚本
 */
export function detectImageType(bytes: Uint8Array): ImageExt | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (starts([0xff, 0xd8, 0xff])) return "jpg";
  if (starts([0x47, 0x49, 0x46, 0x38])) return "gif";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

/** 原文件名 → 图片替代文字：去掉扩展名与会破坏 Markdown 语法的字符 */
export function altFromFileName(name: string): string {
  return name
    .replace(/\.[^.]*$/, "")
    .replace(/[[\]\\\n\r]/g, " ")
    .trim();
}

export function imageMarkdown(alt: string, src: string): string {
  return `![${alt}](${src})`;
}
