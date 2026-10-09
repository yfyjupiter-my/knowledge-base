import { describe, expect, it } from "vitest";
import matter from "gray-matter";
import { BODY_TEMPLATE, SLUG_RE, buildArticleMarkdown, formatLocalDate, slugify, suggestSlug, type ArticleInput } from "./new-article";

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

function article(overrides: Partial<ArticleInput> = {}): ArticleInput {
  return {
    title: "Monitor Shows No Signal",
    slug: "monitor-no-signal",
    summary: "What to check when the screen stays black.",
    category: "hardware",
    tags: ["monitor", "dock", "HDMI"],
    updated: "2026-10-09",
    body: "## 1. Cables\n\n- [ ] Reseat the cable\n",
    ...overrides,
  };
}

/** 按站点 lib/articles.ts 的方式读回 frontmatter */
function readBack(markdown: string): Record<string, unknown> & { content: string } {
  const { data, content } = matter(markdown);
  const updated = data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : data.updated;
  return { ...data, updated, content };
}

describe("buildArticleMarkdown", () => {
  it("输出与现有文章一致的格式", () => {
    expect(buildArticleMarkdown(article())).toBe(
      [
        "---",
        "title: Monitor Shows No Signal",
        "summary: What to check when the screen stays black.",
        "category: hardware",
        "tags: [monitor, dock, HDMI]",
        "updated: 2026-10-09",
        "---",
        "",
        "## 1. Cables",
        "",
        "- [ ] Reseat the cable",
        "",
      ].join("\n"),
    );
  });

  it("无标签时输出 tags: []", () => {
    expect(buildArticleMarkdown(article({ tags: [] }))).toContain("\ntags: []\n");
  });

  it("正文为空时以 frontmatter 结束且只有一个结尾换行", () => {
    expect(buildArticleMarkdown(article({ body: "" })).endsWith("updated: 2026-10-09\n---\n")).toBe(true);
  });

  it("统一换行为 \n 并去掉正文首尾空行", () => {
    const md = buildArticleMarkdown(article({ body: "\r\n\r\nLine 1\r\nLine 2\r\n\r\n\r\n" }));
    expect(md).not.toContain("\r");
    expect(md.endsWith("---\n\nLine 1\nLine 2\n")).toBe(true);
  });

  const tricky = [
    "Error: 0x80070005",
    "C# build #2",
    'He said "hi"',
    "It's fine",
    "[bracketed]",
    "{braced}",
    "a, b",
    "2026-01-01",
    "true",
    "null",
    "123",
    "- dash first",
    "* star first",
    "> quote first",
    "| pipe",
    "@at",
    "`tick`",
    "%percent",
    "&anchor",
    "!tag",
    "?question",
    "back\slash",
    "中文标题：冒号",
  ];

  it.each(tricky)("title/summary 含特殊值 %j 时读回一致", (value) => {
    const back = readBack(buildArticleMarkdown(article({ title: value, summary: value })));
    expect(back.title).toBe(value);
    expect(back.summary).toBe(value);
  });

  it.each(tricky)("tag 含特殊值 %j 时读回一致", (value) => {
    const back = readBack(buildArticleMarkdown(article({ tags: [value, "plain"] })));
    expect(back.tags).toEqual([value, "plain"]);
  });

  it("其余字段读回一致，正文不变", () => {
    const input = article();
    const back = readBack(buildArticleMarkdown(input));
    expect(back).toMatchObject({
      title: input.title,
      summary: input.summary,
      category: input.category,
      tags: input.tags,
      updated: input.updated,
    });
    expect(back.content.trim()).toBe(input.body.trim());
  });
});
