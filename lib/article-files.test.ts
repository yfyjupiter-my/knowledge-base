import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { contentHash, overwriteArticle, parseArticleMarkdown, readArticleFile, slugExists, writeImage, writeNewArticle } from "./article-files";
import { buildArticleMarkdown } from "./new-article";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "kb-articles-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("slugExists", () => {
  it("英文版或中文版任一存在都算存在", () => {
    fs.writeFileSync(path.join(dir, "vpn.zh.md"), "x");
    expect(slugExists(dir, "vpn")).toBe(true);
    fs.writeFileSync(path.join(dir, "wifi.md"), "x");
    expect(slugExists(dir, "wifi")).toBe(true);
  });

  it("前缀相同的其他文件不算", () => {
    fs.writeFileSync(path.join(dir, "vpn-2.md"), "x");
    expect(slugExists(dir, "vpn")).toBe(false);
  });
});

describe("writeNewArticle", () => {
  it("写入 <slug>.md，内容为 UTF-8", async () => {
    expect(await writeNewArticle(dir, "monitor", "---\ntitle: 显示器\n---\n")).toEqual({ ok: true });
    expect(fs.readFileSync(path.join(dir, "monitor.md"), "utf8")).toBe("---\ntitle: 显示器\n---\n");
  });

  it("英文版已存在时不覆盖", async () => {
    fs.writeFileSync(path.join(dir, "vpn.md"), "original");
    expect(await writeNewArticle(dir, "vpn", "new")).toEqual({ ok: false, reason: "exists" });
    expect(fs.readFileSync(path.join(dir, "vpn.md"), "utf8")).toBe("original");
  });

  it("只有中文版存在时也视为冲突，不创建英文版", async () => {
    fs.writeFileSync(path.join(dir, "vpn.zh.md"), "中文");
    expect(await writeNewArticle(dir, "vpn", "new")).toEqual({ ok: false, reason: "exists" });
    expect(fs.existsSync(path.join(dir, "vpn.md"))).toBe(false);
  });

  it("目录不存在时返回 failed", async () => {
    const result = await writeNewArticle(path.join(dir, "missing"), "x", "y");
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe("failed");
  });

  it("非法 slug 直接抛错，绝不拼接路径", async () => {
    await expect(writeNewArticle(dir, "../escape", "y")).rejects.toThrow(/invalid slug/);
    expect(fs.existsSync(path.join(dir, "..", "escape.md"))).toBe(false);
  });
});

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

describe("writeImage", () => {
  it("按内容哈希命名，自动创建目录", async () => {
    const images = path.join(dir, "images");
    const result = await writeImage(images, PNG);
    expect(result.ok).toBe(true);
    const file = result.ok ? result.file : "";
    expect(file).toMatch(/^[a-f0-9]{16}\.png$/);
    expect(fs.readFileSync(path.join(images, file))).toEqual(Buffer.from(PNG));
  });

  it("同一张图重复上传返回同一个文件", async () => {
    const a = await writeImage(dir, PNG);
    const b = await writeImage(dir, PNG);
    expect(b).toEqual(a);
    expect(fs.readdirSync(dir)).toHaveLength(1);
  });

  it("不是支持的图片格式时不写入", async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(await writeImage(dir, svg)).toEqual({ ok: false, reason: "unsupportedType" });
    expect(fs.readdirSync(dir)).toHaveLength(0);
  });
});

describe("readArticleFile", () => {
  it("按语言定位文件并返回内容指纹", async () => {
    fs.writeFileSync(path.join(dir, "vpn.md"), "en");
    fs.writeFileSync(path.join(dir, "vpn.zh.md"), "中文");
    expect(await readArticleFile(dir, "vpn", "en")).toEqual({ raw: "en", hash: contentHash("en") });
    expect(await readArticleFile(dir, "vpn", "zh")).toEqual({ raw: "中文", hash: contentHash("中文") });
  });

  it("文件不存在或 slug 非法时返回 null", async () => {
    expect(await readArticleFile(dir, "missing", "en")).toBeNull();
    expect(await readArticleFile(dir, "../etc", "en")).toBeNull();
  });
});

describe("overwriteArticle", () => {
  it("指纹一致时覆盖对应语言版本", async () => {
    fs.writeFileSync(path.join(dir, "vpn.zh.md"), "old");
    expect(await overwriteArticle(dir, "vpn", "zh", "new", contentHash("old"))).toEqual({ ok: true });
    expect(fs.readFileSync(path.join(dir, "vpn.zh.md"), "utf8")).toBe("new");
  });

  it("文件已被他人修改时拒绝覆盖", async () => {
    fs.writeFileSync(path.join(dir, "vpn.md"), "changed elsewhere");
    expect(await overwriteArticle(dir, "vpn", "en", "new", contentHash("old"))).toEqual({ ok: false, reason: "conflict" });
    expect(fs.readFileSync(path.join(dir, "vpn.md"), "utf8")).toBe("changed elsewhere");
  });

  it("文件不存在时不创建", async () => {
    expect(await overwriteArticle(dir, "vpn", "en", "new", contentHash(""))).toEqual({ ok: false, reason: "notFound" });
    expect(fs.existsSync(path.join(dir, "vpn.md"))).toBe(false);
  });

  it("拒绝非法 slug", async () => {
    await expect(overwriteArticle(dir, "../x", "en", "new", "")).rejects.toThrow();
  });
});

describe("parseArticleMarkdown", () => {
  it("拆出各字段；未加引号的日期转回 YYYY-MM-DD", () => {
    const raw = '---\ntitle: "VPN: 809"\nsummary: 一句话\ncategory: network\ntags: [VPN, "a,b"]\nupdated: 2026-09-18\n---\n\n## 1. Step\n';
    expect(parseArticleMarkdown(raw)).toEqual({
      title: "VPN: 809",
      summary: "一句话",
      category: "network",
      tags: ["VPN", "a,b"],
      updated: "2026-09-18",
      body: "## 1. Step\n",
    });
  });

  it("缺少的字段为空", () => {
    expect(parseArticleMarkdown("just body")).toEqual({ title: "", summary: "", category: "", tags: [], updated: "", body: "just body" });
  });

  // 引号风格可能变化（如含双引号的摘要会被整体加引号），但字段值与正文必须一字不差
  it("现有文章解析后重新生成，字段与正文不变", () => {
    const articles = path.join(process.cwd(), "content", "articles");
    for (const file of fs.readdirSync(articles).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
      const parsed = parseArticleMarkdown(fs.readFileSync(path.join(articles, file), "utf8"));
      const rebuilt = parseArticleMarkdown(buildArticleMarkdown({ ...parsed, slug: "x" }));
      expect({ ...rebuilt, body: rebuilt.body.trimEnd() }, file).toEqual({ ...parsed, body: parsed.body.trimEnd() });
    }
  });
});
