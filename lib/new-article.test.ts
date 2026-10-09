import { describe, expect, it } from "vitest";
import { BODY_TEMPLATE, SLUG_RE, formatLocalDate, slugify, suggestSlug } from "./new-article";

describe("slugify", () => {
  it("转为小写并用短横线连接单词", () => {
    expect(slugify("Monitor Shows No Signal")).toBe("monitor-shows-no-signal");
  });
  it("把标点和连续空白合并为单个短横线", () => {
    expect(slugify("VPN  error: 809 (L2TP)")).toBe("vpn-error-809-l2tp");
  });
  it("去掉首尾的短横线", () => {
    expect(slugify("  --Hello, World!--  ")).toBe("hello-world");
  });
  it("纯中文标题返回空字符串", () => {
    expect(slugify("显示器无信号")).toBe("");
  });
  it("中英混合时只保留英文和数字", () => {
    expect(slugify("Outlook 崩溃 0x80070005")).toBe("outlook-0x80070005");
  });
  it("结果总是满足 SLUG_RE 或为空", () => {
    for (const t of ["A", "a-b", "__x__", "Ünïcödé 1"]) {
      const s = slugify(t);
      expect(s === "" || SLUG_RE.test(s)).toBe(true);
    }
  });
});

describe("SLUG_RE", () => {
  it("拒绝下划线开头、大写、空格和路径字符", () => {
    for (const bad of ["_draft", "-x", "Abc", "a b", "../x", "a/b", "a.md", ""]) {
      expect(SLUG_RE.test(bad)).toBe(false);
    }
  });
});

describe("suggestSlug", () => {
  it("返回第一个不存在的 -n 后缀", () => {
    const taken = new Set(["vpn-2", "vpn-3"]);
    expect(suggestSlug("vpn", (s) => taken.has(s))).toBe("vpn-4");
  });
  it("没有占用时返回 -2", () => {
    expect(suggestSlug("vpn", () => false)).toBe("vpn-2");
  });
});

describe("formatLocalDate", () => {
  it("按本地时间格式化为 YYYY-MM-DD 并补零", () => {
    expect(formatLocalDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("BODY_TEMPLATE", () => {
  it("包含章节标题和两个空步骤", () => {
    expect(BODY_TEMPLATE).toBe("## 1. First steps\n\n- [ ] \n- [ ] \n");
  });
});
