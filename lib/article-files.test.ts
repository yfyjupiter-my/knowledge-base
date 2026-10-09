import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { slugExists, writeNewArticle } from "./article-files";

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
