import { readFile } from "node:fs/promises";
import path from "node:path";
import { IMAGES_DIR } from "@/lib/articles";
import { IMAGE_FILE_RE, IMAGE_TYPES, type ImageExt } from "@/lib/images";

/**
 * 提供 content/images/ 下的图片。不放在 public/：standalone 模式只提供构建时已存在的
 * public 文件，运行时上传的图片必须由这里读取。文件名是内容哈希，可以永久缓存。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!IMAGE_FILE_RE.test(file)) return new Response("Not found", { status: 404 });
  let data: Buffer;
  try {
    data = await readFile(path.join(IMAGES_DIR, file));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": IMAGE_TYPES[path.extname(file).slice(1) as ImageExt],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
