# 新建文章图形界面（/new）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `npm run dev` 下提供 `/new` 表单页，填写后一键生成规范的英文文章 `content/articles/<slug>.md`。

**Architecture:** 纯逻辑（slug、校验、frontmatter 生成、正文片段插入）放在无副作用的 `lib/` 模块并用 Vitest 测试；文件读写集中在 `lib/article-files.ts`（以目录为参数，便于用临时目录测试）；`app/[lang]/new/` 下的 Server Action 串起二者，客户端组件 `components/article-editor.tsx` 负责表单与实时预览（复用站点的 `<Markdown>`）。功能开关 `isAuthoringEnabled()` 仅在 `NODE_ENV === "development"` 时为真。

**Tech Stack:** Next.js 15 App Router（Server Actions）· React 19 · TypeScript · Tailwind CSS v4 · js-yaml · gray-matter · Vitest 4

**Spec:** `docs/superpowers/specs/2026-10-09-new-article-form-design.md`

## Global Constraints

- 仅在 `process.env.NODE_ENV === "development"` 时可用；否则 `/new` 返回 404、顶栏无按钮、Server Action 不触碰文件系统
- 生成的文章固定为英文版 `content/articles/<slug>.md`（英文为默认语言，不带语言后缀）
- slug 必须匹配 `^[a-z0-9][a-z0-9-]*$`；`<slug>.md` 或 `<slug>.zh.md` 任一存在即为冲突；写入使用 `flag: "wx"`，绝不覆盖
- frontmatter 字段顺序：title、summary、category、tags、updated；`tags` 为流式数组 `[a, b]`，空时为 `tags: []`
- 必填：title、slug、summary、category、updated；category 必须是 `categories.yml` 中的 id
- 正文预填骨架：`## 1. First steps\n\n- [ ] \n- [ ] \n`
- slug 冲突建议名依次为 `<slug>-2`、`<slug>-3`…；实时冲突检查防抖 300ms
- 代码块语言可选：powershell / bash / cmd / json / yaml / 无
- 界面文案走 `lib/i18n.ts` 字典（新增 `editor` 段，中英两份结构一致）
- Vitest 固定为 `vitest@4.1.11`（兼容 `package.json` 的 `node >=20.9`），仅作 devDependency
- 不新增其他运行时依赖

## Review Focus

1. **中文输入法回车**：在标签框用中文输入法打字、按回车选词时，不应把半截拼音加成标签 → Task 6 在 keydown 中判断 `isComposing`
2. **在输入框里按回车**：在标题或摘要框按回车，不应意外提交表单、生成一篇只有骨架的文章 → Task 6 拦截表单内非 textarea 的回车
3. **站内链接导致内容丢失**：写到一半点击左侧目录的文章链接（客户端路由不会触发 `beforeunload`），应先弹出确认 → Task 6 在捕获阶段拦截链接点击
4. **特殊字符的标题、摘要、标签**：如 `Error: 0x80070005`、`C# build #2`、`"quoted"`、`2026-01-01`、`true`，读回后必须与输入完全一致，且不会让站点解析失败 → Task 2 的往返测试
5. **未点回车的标签**：用户在标签框输入了文字但没按回车就点"创建"，这个标签不应丢失 → Task 6 提交时合并 `tagDraft`，失焦时也加入

---

## File Structure

| 文件 | 操作 | 职责 |
| --- | --- | --- |
| `package.json` | 修改 | 新增 `test` 脚本与 `vitest` 开发依赖 |
| `lib/new-article.ts` | 新建 | `ArticleInput` 类型、`isAuthoringEnabled`、`slugify`、`suggestSlug`、`formatLocalDate`、`validateArticleInput`、`buildArticleMarkdown`、`BODY_TEMPLATE`、`SLUG_RE` |
| `lib/new-article.test.ts` | 新建 | 上述纯函数测试 |
| `lib/editor-snippets.ts` | 新建 | 工具栏片段定义与 `insertSnippet` |
| `lib/editor-snippets.test.ts` | 新建 | 片段插入测试 |
| `lib/article-files.ts` | 新建 | `slugExists`、`writeNewArticle`（以目录为参数） |
| `lib/article-files.test.ts` | 新建 | 使用临时目录的文件读写测试 |
| `lib/i18n.ts` | 修改 | 新增 `editor` 文案 |
| `app/[lang]/new/actions.ts` | 新建 | Server Actions：`createArticle`、`checkSlug` |
| `app/[lang]/new/page.tsx` | 新建 | 开关检查、读取分类、渲染编辑器 |
| `components/article-editor.tsx` | 新建 | 客户端表单、标签输入、工具栏、预览 |
| `app/[lang]/layout.tsx` | 修改 | 开发模式下顶栏显示 "New article" 按钮 |
| `README.md` | 修改 | "新建文章"一节加入图形界面说明，测试命令 |

---

### Task 1: Vitest 与 slug 工具函数

**Files:**
- Modify: `package.json`
- Create: `lib/new-article.ts`
- Test: `lib/new-article.test.ts`

**Interfaces:**
- Produces: `SLUG_RE: RegExp`、`isAuthoringEnabled(): boolean`、`slugify(title: string): string`、`suggestSlug(slug: string, exists: (candidate: string) => boolean): string`、`formatLocalDate(d: Date): string`、`BODY_TEMPLATE: string`

- [ ] **Step 1: 安装 Vitest 并添加脚本**

Run: `npm install --save-dev --save-exact vitest@4.1.11`

然后编辑 `package.json` 的 `scripts`，在 `typecheck` 后加入 `test`：

```json
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
```

- [ ] **Step 2: 写失败的测试**

`lib/new-article.test.ts`：

```ts
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
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test`
Expected: FAIL，提示无法解析 `./new-article`

- [ ] **Step 4: 写实现**

`lib/new-article.ts`：

```ts
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
```

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test`
Expected: PASS（全部用例通过）

- [ ] **Step 6: 类型检查**

Run: `npm run typecheck`
Expected: 无输出错误

- [ ] **Step 7: 提交**

```bash
git add package.json package-lock.json lib/new-article.ts lib/new-article.test.ts
git commit -m "feat(new): 新增 Vitest 与 slug 工具函数"
```

---

### Task 2: frontmatter 生成 `buildArticleMarkdown`

**Files:**
- Modify: `lib/new-article.ts`
- Test: `lib/new-article.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `lib/new-article.ts`
- Produces:
  ```ts
  export interface ArticleInput {
    title: string; slug: string; summary: string; category: string;
    tags: string[]; updated: string; body: string;
  }
  export function buildArticleMarkdown(article: ArticleInput): string
  ```

- [ ] **Step 1: 写失败的测试**

在 `lib/new-article.test.ts` 顶部的 import 改为：

```ts
import { describe, expect, it } from "vitest";
import matter from "gray-matter";
import { BODY_TEMPLATE, SLUG_RE, buildArticleMarkdown, formatLocalDate, slugify, suggestSlug, type ArticleInput } from "./new-article";
```

文件末尾追加：

```ts
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
function readBack(markdown: string) {
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

  it("统一换行为 \\n 并去掉正文首尾空行", () => {
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
    "back\\slash",
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL，`buildArticleMarkdown` 未导出

- [ ] **Step 3: 写实现**

在 `lib/new-article.ts` 顶部加入 import（第一行注释之后）：

```ts
import yaml from "js-yaml";
```

在文件末尾追加：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS。若某个特殊值失败，说明 `parsesTo` 判断有漏洞：检查该值单独 `yaml.load` 的结果，不要放宽测试。

- [ ] **Step 5: 类型检查并提交**

Run: `npm run typecheck`
Expected: 无错误

```bash
git add lib/new-article.ts lib/new-article.test.ts
git commit -m "feat(new): 生成规范 frontmatter 的 buildArticleMarkdown"
```

---

### Task 3: 输入校验 `validateArticleInput`

**Files:**
- Modify: `lib/new-article.ts`
- Test: `lib/new-article.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `ArticleInput`
- Produces:
  ```ts
  export type ArticleField = keyof ArticleInput;
  export type FieldError = "required" | "invalidSlug" | "unknownCategory" | "invalidDate" | "exists";
  export type FieldErrors = Partial<Record<ArticleField, FieldError>>;
  export type ValidationResult = { ok: true; value: ArticleInput } | { ok: false; fieldErrors: FieldErrors };
  export function validateArticleInput(raw: unknown, categoryIds: readonly string[]): ValidationResult
  ```
  `"exists"` 由 Task 5 的 Server Action 使用，本函数不会产生它。

- [ ] **Step 1: 写失败的测试**

把 `lib/new-article.test.ts` 的 import 中加入 `validateArticleInput`：

```ts
import { BODY_TEMPLATE, SLUG_RE, buildArticleMarkdown, formatLocalDate, slugify, suggestSlug, validateArticleInput, type ArticleInput } from "./new-article";
```

文件末尾追加：

```ts
describe("validateArticleInput", () => {
  const ids = ["network", "hardware"];

  it("合法输入通过并返回规范化后的值", () => {
    const result = validateArticleInput(
      article({
        title: "  Title  ",
        summary: " line one\r\n  line two ",
        tags: [" a ", "b", "a", "", "  "],
        body: "x\r\ny",
      }),
      ids,
    );
    expect(result).toEqual({
      ok: true,
      value: article({ title: "Title", summary: "line one line two", tags: ["a", "b"], body: "x\ny" }),
    });
  });

  it("必填项为空（或只有空白）时报 required", () => {
    const result = validateArticleInput(article({ title: " ", slug: "", summary: "\n", category: "", updated: "" }), ids);
    expect(result).toEqual({
      ok: false,
      fieldErrors: { title: "required", slug: "required", summary: "required", category: "required", updated: "required" },
    });
  });

  it.each(["_draft", "Abc", "a b", "../etc", "a.md", "-x"])("slug %j 报 invalidSlug", (slug) => {
    expect(validateArticleInput(article({ slug }), ids)).toEqual({ ok: false, fieldErrors: { slug: "invalidSlug" } });
  });

  it("分类不在列表中报 unknownCategory", () => {
    expect(validateArticleInput(article({ category: "other" }), ids)).toEqual({
      ok: false,
      fieldErrors: { category: "unknownCategory" },
    });
  });

  it.each(["2026-13-01", "2026-02-30", "2026/10/09", "09-10-2026", "2026-1-1"])("日期 %j 报 invalidDate", (updated) => {
    expect(validateArticleInput(article({ updated }), ids)).toEqual({ ok: false, fieldErrors: { updated: "invalidDate" } });
  });

  it("闰年 2 月 29 日合法", () => {
    expect(validateArticleInput(article({ updated: "2028-02-29" }), ids).ok).toBe(true);
  });

  it("非对象或字段类型错误时按空值处理，不抛异常", () => {
    expect(validateArticleInput(null, ids).ok).toBe(false);
    const result = validateArticleInput({ ...article(), title: 42, tags: "a,b" }, ids);
    expect(result).toEqual({ ok: false, fieldErrors: { title: "required" } });
    const ok = validateArticleInput({ ...article(), tags: ["x", 1, null] }, ids);
    expect(ok.ok && ok.value.tags).toEqual(["x"]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL，`validateArticleInput` 未导出

- [ ] **Step 3: 写实现**

在 `lib/new-article.ts` 末尾追加：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 类型检查并提交**

Run: `npm run typecheck`
Expected: 无错误

```bash
git add lib/new-article.ts lib/new-article.test.ts
git commit -m "feat(new): 新建文章输入校验"
```

---

### Task 4: 正文工具栏片段 `lib/editor-snippets.ts`

**Files:**
- Create: `lib/editor-snippets.ts`
- Test: `lib/editor-snippets.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Snippet { before: string; after: string }
  export const HEADING: Snippet;
  export const STEP: Snippet;
  export const CALLOUT_KINDS: readonly ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
  export type CalloutKind = (typeof CALLOUT_KINDS)[number];
  export const CODE_LANGUAGES: readonly ["powershell", "bash", "cmd", "json", "yaml"];
  export function calloutSnippet(kind: CalloutKind): Snippet
  export function codeSnippet(language: string): Snippet   // "" = 不指定语言
  export function insertSnippet(text: string, start: number, end: number, snippet: Snippet): { text: string; cursor: number }
  ```

- [ ] **Step 1: 写失败的测试**

`lib/editor-snippets.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { HEADING, STEP, calloutSnippet, codeSnippet, insertSnippet } from "./editor-snippets";

describe("insertSnippet", () => {
  it("在空文本中插入，光标位于前缀之后", () => {
    expect(insertSnippet("", 0, 0, STEP)).toEqual({ text: "- [ ] ", cursor: 6 });
  });

  it("光标在行中时先换行，保证片段从新行开始", () => {
    expect(insertSnippet("abc", 3, 3, HEADING)).toEqual({ text: "abc\n## ", cursor: 7 });
  });

  it("光标后面还有同一行的文字时，在片段后补换行", () => {
    expect(insertSnippet("abc", 0, 0, STEP)).toEqual({ text: "- [ ] \nabc", cursor: 6 });
  });

  it("包裹选中的文字，光标位于选中文字之后", () => {
    const r = insertSnippet("x\nls -la\ny", 2, 8, codeSnippet("bash"));
    expect(r.text).toBe("x\n```bash\nls -la\n```\ny");
    expect(r.cursor).toBe("x\n```bash\nls -la".length);
  });

  it("在行首插入时不额外换行", () => {
    expect(insertSnippet("a\n", 2, 2, calloutSnippet("WARNING"))).toEqual({
      text: "a\n> [!WARNING]\n> ",
      cursor: "a\n> [!WARNING]\n> ".length,
    });
  });
});

describe("codeSnippet", () => {
  it("不指定语言时为纯代码块", () => {
    expect(codeSnippet("")).toEqual({ before: "```\n", after: "\n```" });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL，无法解析 `./editor-snippets`

- [ ] **Step 3: 写实现**

`lib/editor-snippets.ts`：

```ts
/** /new 正文工具栏：在光标处插入块级 Markdown 片段，选中的文字会被包裹在片段中 */

export interface Snippet {
  before: string;
  after: string;
}

export const HEADING: Snippet = { before: "## ", after: "" };
export const STEP: Snippet = { before: "- [ ] ", after: "" };

export const CALLOUT_KINDS = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];

export const CODE_LANGUAGES = ["powershell", "bash", "cmd", "json", "yaml"] as const;

export function calloutSnippet(kind: CalloutKind): Snippet {
  return { before: `> [!${kind}]\n> `, after: "" };
}

export function codeSnippet(language: string): Snippet {
  return { before: "```" + language + "\n", after: "\n```" };
}

/** 片段总是独占一行：光标前后不是换行时自动补上 */
export function insertSnippet(text: string, start: number, end: number, snippet: Snippet): { text: string; cursor: number } {
  const selected = text.slice(start, end);
  const lead = start > 0 && text[start - 1] !== "\n" ? "\n" : "";
  const trail = end < text.length && text[end] !== "\n" ? "\n" : "";
  const inserted = lead + snippet.before + selected + snippet.after + trail;
  return {
    text: text.slice(0, start) + inserted + text.slice(end),
    cursor: start + lead.length + snippet.before.length + selected.length,
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add lib/editor-snippets.ts lib/editor-snippets.test.ts
git commit -m "feat(new): 正文工具栏片段插入"
```

---

### Task 5: 文件读写 `lib/article-files.ts`

**Files:**
- Create: `lib/article-files.ts`
- Test: `lib/article-files.test.ts`

**Interfaces:**
- Consumes: `SLUG_RE`（Task 1），`LOCALES`、`DEFAULT_LOCALE`（`lib/i18n.ts`，现有）
- Produces:
  ```ts
  export function slugExists(dir: string, slug: string): boolean
  export type WriteResult = { ok: true } | { ok: false; reason: "exists" } | { ok: false; reason: "failed"; message: string };
  export async function writeNewArticle(dir: string, slug: string, content: string): Promise<WriteResult>
  ```

- [ ] **Step 1: 写失败的测试**

`lib/article-files.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL，无法解析 `./article-files`

- [ ] **Step 3: 写实现**

`lib/article-files.ts`：

```ts
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_LOCALE, LOCALES } from "./i18n";
import { SLUG_RE } from "./new-article";

/** 同一 slug 各语言版本的文件名：vpn.md（默认语言）、vpn.zh.md */
function fileNames(slug: string): string[] {
  return LOCALES.map((l) => (l === DEFAULT_LOCALE ? `${slug}.md` : `${slug}.${l}.md`));
}

export function slugExists(dir: string, slug: string): boolean {
  return fileNames(slug).some((f) => existsSync(path.join(dir, f)));
}

export type WriteResult = { ok: true } | { ok: false; reason: "exists" } | { ok: false; reason: "failed"; message: string };

/** 新建默认语言版本；wx 标志保证即使检查后被抢先创建也不会覆盖 */
export async function writeNewArticle(dir: string, slug: string, content: string): Promise<WriteResult> {
  if (!SLUG_RE.test(slug)) throw new Error(`invalid slug: ${slug}`);
  if (slugExists(dir, slug)) return { ok: false, reason: "exists" };
  try {
    await writeFile(path.join(dir, `${slug}.md`), content, { encoding: "utf8", flag: "wx" });
    return { ok: true };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "EEXIST") return { ok: false, reason: "exists" };
    return { ok: false, reason: "failed", message: err.message };
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 类型检查并提交**

Run: `npm run typecheck`
Expected: 无错误

```bash
git add lib/article-files.ts lib/article-files.test.ts
git commit -m "feat(new): 新建文章的文件读写（不覆盖已有文件）"
```

---

### Task 6: `/new` 页面、Server Actions、编辑器组件、顶栏按钮与文案

**Files:**
- Modify: `lib/i18n.ts`（`zh` 与 `en` 字典各加 `editor` 段）
- Create: `app/[lang]/new/actions.ts`
- Create: `app/[lang]/new/page.tsx`
- Create: `components/article-editor.tsx`
- Modify: `app/[lang]/layout.tsx`（顶栏按钮）

**Interfaces:**
- Consumes: Task 1–5 的全部导出；现有 `ARTICLES_DIR`（`lib/articles.ts`）、`getCategories()`（`lib/categories.server.ts`）、`Markdown`（`components/markdown.tsx`）、`getDictionary`、`localePath`、`isLocale`、`DEFAULT_LOCALE`
- Produces:
  ```ts
  // app/[lang]/new/actions.ts
  export type CreateArticleState = { fieldErrors?: FieldErrors; formError?: "disabled" | "writeFailed"; detail?: string; suggestion?: string };
  export async function createArticle(lang: string, raw: unknown): Promise<CreateArticleState>  // 成功时 redirect，不返回
  export async function checkSlug(slug: string): Promise<{ exists: boolean; suggestion?: string }>
  // components/article-editor.tsx
  export function ArticleEditor(props: { lang: Locale; categories: { id: string; label: string }[]; today: string }): JSX.Element
  ```

本任务以界面为主，没有单元测试，验收用 Step 8 的浏览器检查。

- [ ] **Step 1: 添加文案**

在 `lib/i18n.ts` 的 `zh` 对象中、`notFound` 段之后加入（注意 `zh` 定义了 `Dictionary` 类型，`en` 必须结构相同）：

```ts
  editor: {
    navButton: "新建文章",
    title: "新建文章",
    intro: "填写后点击“创建”，将在 content/articles/ 下生成英文文章。此页面仅在 npm run dev 下可用，创建后请自行用 Git 提交。",
    fields: { title: "标题", slug: "文件名", summary: "摘要", category: "分类", tags: "标签", updated: "更新日期", body: "正文" },
    placeholders: {
      title: "e.g. Monitor Shows No Signal",
      summary: "One sentence describing when this article applies",
      category: "选择分类",
      tags: "输入后按回车或逗号添加",
    },
    hints: {
      slug: (slug: string) => `保存为 content/articles/${slug || "…"}.md`,
      slugManual: "标题中没有英文字母或数字，请手动填写文件名",
      summary: (n: number) => `${n} 个字符`,
    },
    toolbar: { heading: "章节", step: "步骤", callout: "提示框", code: "代码块", plain: "纯文本" },
    tabs: { edit: "编辑", preview: "预览" },
    previewEmpty: "正文为空",
    removeTag: (tag: string) => `删除标签 ${tag}`,
    submit: "创建",
    submitting: "正在创建…",
    leaveConfirm: "有尚未保存的内容，确定离开吗？",
    errors: {
      required: "此项必填",
      invalidSlug: "只能使用小写英文字母、数字和短横线，且必须以字母或数字开头",
      unknownCategory: "分类不存在，请重新选择",
      invalidDate: "日期格式应为 YYYY-MM-DD",
      exists: "同名文章已存在",
      disabled: "只有在开发模式（npm run dev）下才能创建文章",
      writeFailed: (detail: string) => `写入文件失败：${detail}`,
    },
    suggestion: (slug: string) => `可以使用 ${slug}`,
    useSuggestion: "使用",
  },
```

在 `en` 对象中、`notFound` 段之后加入：

```ts
  editor: {
    navButton: "New article",
    title: "New article",
    intro: "Fill in the form and click Create to generate an English article in content/articles/. This page is only available under npm run dev; commit the file with Git afterwards.",
    fields: { title: "Title", slug: "File name", summary: "Summary", category: "Category", tags: "Tags", updated: "Updated", body: "Body" },
    placeholders: {
      title: "e.g. Monitor Shows No Signal",
      summary: "One sentence describing when this article applies",
      category: "Choose a category",
      tags: "Type and press Enter or comma",
    },
    hints: {
      slug: (slug: string) => `Saved as content/articles/${slug || "…"}.md`,
      slugManual: "The title has no English letters or digits. Enter a file name manually.",
      summary: (n: number) => `${n} character${n === 1 ? "" : "s"}`,
    },
    toolbar: { heading: "Section", step: "Step", callout: "Callout", code: "Code", plain: "Plain text" },
    tabs: { edit: "Edit", preview: "Preview" },
    previewEmpty: "Nothing to preview",
    removeTag: (tag: string) => `Remove tag ${tag}`,
    submit: "Create",
    submitting: "Creating…",
    leaveConfirm: "You have unsaved changes. Leave this page?",
    errors: {
      required: "Required",
      invalidSlug: "Use lowercase letters, digits and hyphens only, starting with a letter or digit",
      unknownCategory: "This category no longer exists. Choose another one.",
      invalidDate: "Use the format YYYY-MM-DD",
      exists: "An article with this file name already exists",
      disabled: "Articles can only be created in development mode (npm run dev)",
      writeFailed: (detail: string) => `Could not write the file: ${detail}`,
    },
    suggestion: (slug: string) => `Try ${slug}`,
    useSuggestion: "Use",
  },
```

Run: `npm run typecheck`
Expected: 无错误（两份字典结构一致）

- [ ] **Step 2: Server Actions**

`app/[lang]/new/actions.ts`：

```ts
"use server";

import { redirect } from "next/navigation";
import { slugExists, writeNewArticle } from "@/lib/article-files";
import { ARTICLES_DIR } from "@/lib/articles";
import { getCategories } from "@/lib/categories.server";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n";
import { SLUG_RE, buildArticleMarkdown, isAuthoringEnabled, suggestSlug, validateArticleInput, type FieldErrors } from "@/lib/new-article";

export type CreateArticleState = {
  fieldErrors?: FieldErrors;
  formError?: "disabled" | "writeFailed";
  detail?: string;
  suggestion?: string;
};

function suggestionFor(slug: string): string {
  return suggestSlug(slug, (s) => slugExists(ARTICLES_DIR, s));
}

/** 校验并写入新文章；成功时跳转到文章页，失败时返回错误供表单展示 */
export async function createArticle(lang: string, raw: unknown): Promise<CreateArticleState> {
  if (!isAuthoringEnabled()) return { formError: "disabled" };
  const result = validateArticleInput(raw, getCategories().map((c) => c.id));
  if (!result.ok) return { fieldErrors: result.fieldErrors };

  const { value } = result;
  const written = await writeNewArticle(ARTICLES_DIR, value.slug, buildArticleMarkdown(value));
  if (!written.ok) {
    if (written.reason === "exists") return { fieldErrors: { slug: "exists" }, suggestion: suggestionFor(value.slug) };
    return { formError: "writeFailed", detail: written.message };
  }
  redirect(localePath(isLocale(lang) ? lang : DEFAULT_LOCALE, `/articles/${value.slug}`));
}

/** 输入文件名时实时检查是否已被占用 */
export async function checkSlug(slug: string): Promise<{ exists: boolean; suggestion?: string }> {
  if (!isAuthoringEnabled() || typeof slug !== "string" || !SLUG_RE.test(slug)) return { exists: false };
  if (!slugExists(ARTICLES_DIR, slug)) return { exists: false };
  return { exists: true, suggestion: suggestionFor(slug) };
}
```

- [ ] **Step 3: 编辑器组件**

`components/article-editor.tsx`：

```tsx
"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Code, Heading2, Info, ListChecks, X } from "lucide-react";
import { checkSlug, createArticle, type CreateArticleState } from "@/app/[lang]/new/actions";
import { Markdown } from "@/components/markdown";
import { CALLOUT_KINDS, CODE_LANGUAGES, HEADING, STEP, calloutSnippet, codeSnippet, insertSnippet, type CalloutKind, type Snippet } from "@/lib/editor-snippets";
import { getDictionary, type Locale } from "@/lib/i18n";
import { BODY_TEMPLATE, SLUG_RE, slugify, type ArticleField } from "@/lib/new-article";

type CategoryOption = { id: string; label: string };

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900";
const toolButtonClass =
  "inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
const proseClass =
  "prose prose-slate max-w-none dark:prose-invert prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 dark:prose-h2:border-slate-800 prose-a:text-sky-700 dark:prose-a:text-sky-400 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-slate-800 prose-table:text-sm";

function splitTags(raw: string): string[] {
  return raw.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}

export function ArticleEditor({ lang, categories, today }: { lang: Locale; categories: CategoryOption[]; today: string }) {
  const d = getDictionary(lang).editor;
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [updated, setUpdated] = useState(today);
  const [body, setBody] = useState(BODY_TEMPLATE);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [state, setState] = useState<CreateArticleState>({});
  const [taken, setTaken] = useState<{ suggestion?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  // 用户已在站内链接的确认框中选择离开，避免随后的整页跳转再弹一次 beforeunload
  const leaving = useRef(false);

  const dirty = title !== "" || summary !== "" || tags.length > 0 || tagDraft !== "" || body !== BODY_TEMPLATE;

  // 关闭标签页或刷新：浏览器原生确认；站内链接（客户端路由不触发 beforeunload）：捕获点击后确认
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leaving.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) return;
      if (window.confirm(d.leaveConfirm)) {
        leaving.current = true;
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, d.leaveConfirm]);

  // 文件名实时查重（300ms 防抖）
  useEffect(() => {
    setTaken(null);
    if (!SLUG_RE.test(slug)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const r = await checkSlug(slug);
        if (!cancelled) setTaken(r.exists ? { suggestion: r.suggestion } : null);
      } catch {
        // 查重只是提示，失败时以提交时的服务端检查为准
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  function clearError(field: ArticleField) {
    setState((s) => (s.fieldErrors?.[field] ? { ...s, fieldErrors: { ...s.fieldErrors, [field]: undefined } } : s));
  }

  function errorFor(field: ArticleField): string | undefined {
    const code = state.fieldErrors?.[field];
    return code ? d.errors[code] : undefined;
  }

  function onTitleChange(value: string) {
    setTitle(value);
    clearError("title");
    if (!slugEdited) {
      setSlug(slugify(value));
      clearError("slug");
    }
  }

  function onSlugChange(value: string) {
    setSlug(value);
    setSlugEdited(true);
    clearError("slug");
  }

  function applySuggestion(value: string) {
    onSlugChange(value);
    setState((s) => ({ ...s, suggestion: undefined }));
  }

  function addTags(raw: string) {
    const parts = splitTags(raw);
    if (parts.length === 0) return;
    setTags((prev) => {
      const next = [...prev];
      for (const p of parts) if (!next.includes(p)) next.push(p);
      return next;
    });
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // 中文输入法选词时的回车不是"添加标签"
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      addTags(tagDraft);
      setTagDraft("");
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function onTagChange(value: string) {
    // 粘贴 "a, b, c" 时，除最后一段外立即转成标签
    const parts = value.split(/[,，]/);
    if (parts.length > 1) {
      addTags(parts.slice(0, -1).join(","));
      setTagDraft(parts[parts.length - 1]);
    } else {
      setTagDraft(value);
    }
  }

  function insert(snippet: Snippet) {
    const el = bodyRef.current;
    if (!el) return;
    const { text, cursor } = insertSnippet(body, el.selectionStart, el.selectionEnd, snippet);
    setBody(text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function submit() {
    const pendingTags = splitTags(tagDraft);
    const allTags = [...tags, ...pendingTags.filter((t) => !tags.includes(t))];
    if (pendingTags.length > 0) {
      setTags(allTags);
      setTagDraft("");
    }
    startTransition(async () => {
      // 成功时服务端会 redirect 到文章页，此处不会拿到返回值
      const result = await createArticle(lang, { title, slug, summary, category, tags: allTags, updated, body });
      if (result) setState(result);
    });
  }

  // 只有正文 textarea 允许回车换行；其他输入框按回车不提交表单
  function onFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault();
  }

  const slugError = errorFor("slug") ?? (taken ? d.errors.exists : undefined);
  const suggestion = state.suggestion ?? taken?.suggestion;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{d.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{d.intro}</p>

      {state.formError && (
        <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">
          {state.formError === "disabled" ? d.errors.disabled : d.errors.writeFailed(state.detail ?? "")}
        </p>
      )}

      <form
        className="mt-6 space-y-6"
        onKeyDown={onFormKeyDown}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={d.fields.title} htmlFor="title" error={errorFor("title")}>
            <input id="title" className={inputClass} value={title} placeholder={d.placeholders.title} onChange={(e) => onTitleChange(e.target.value)} autoFocus />
          </Field>

          <Field
            label={d.fields.slug}
            htmlFor="slug"
            error={slugError}
            hint={title && !slug ? d.hints.slugManual : d.hints.slug(slug)}
            extra={
              slugError && suggestion ? (
                <span className="text-xs text-slate-500">
                  {d.suggestion(suggestion)}{" "}
                  <button type="button" className="font-medium text-sky-700 hover:underline dark:text-sky-400" onClick={() => applySuggestion(suggestion)}>
                    {d.useSuggestion}
                  </button>
                </span>
              ) : null
            }
          >
            <input id="slug" className={`${inputClass} font-mono`} value={slug} onChange={(e) => onSlugChange(e.target.value)} spellCheck={false} autoCapitalize="off" />
          </Field>

          <Field label={d.fields.summary} htmlFor="summary" error={errorFor("summary")} hint={d.hints.summary(summary.length)} className="md:col-span-2">
            <input
              id="summary"
              className={inputClass}
              value={summary}
              placeholder={d.placeholders.summary}
              onChange={(e) => {
                setSummary(e.target.value);
                clearError("summary");
              }}
            />
          </Field>

          <Field label={d.fields.category} htmlFor="category" error={errorFor("category")}>
            <select
              id="category"
              className={inputClass}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                clearError("category");
              }}
            >
              <option value="">{d.placeholders.category}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={d.fields.updated} htmlFor="updated" error={errorFor("updated")}>
            <input
              id="updated"
              type="date"
              className={inputClass}
              value={updated}
              onChange={(e) => {
                setUpdated(e.target.value);
                clearError("updated");
              }}
            />
          </Field>

          <Field label={d.fields.tags} htmlFor="tags" className="md:col-span-2">
            <div className={`${inputClass} flex flex-wrap items-center gap-1.5`}>
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {tag}
                  <button type="button" aria-label={d.removeTag(tag)} onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                id="tags"
                className="min-w-32 flex-1 bg-transparent outline-none"
                value={tagDraft}
                placeholder={tags.length === 0 ? d.placeholders.tags : undefined}
                onKeyDown={onTagKeyDown}
                onChange={(e) => onTagChange(e.target.value)}
                onBlur={() => {
                  addTags(tagDraft);
                  setTagDraft("");
                }}
              />
            </div>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 lg:hidden" role="tablist">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 text-sm ${tab === t ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-400"}`}
              >
                {d.tabs[t]}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={tab === "edit" ? "" : "hidden lg:block"}>
              <label htmlFor="body" className="text-sm font-medium">
                {d.fields.body}
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <button type="button" className={toolButtonClass} onClick={() => insert(HEADING)}>
                  <Heading2 className="size-3.5" aria-hidden />
                  {d.toolbar.heading}
                </button>
                <button type="button" className={toolButtonClass} onClick={() => insert(STEP)}>
                  <ListChecks className="size-3.5" aria-hidden />
                  {d.toolbar.step}
                </button>
                <label className={toolButtonClass}>
                  <Info className="size-3.5" aria-hidden />
                  <select
                    aria-label={d.toolbar.callout}
                    className="bg-transparent outline-none"
                    value=""
                    onChange={(e) => e.target.value && insert(calloutSnippet(e.target.value as CalloutKind))}
                  >
                    <option value="">{d.toolbar.callout}</option>
                    {CALLOUT_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={toolButtonClass}>
                  <Code className="size-3.5" aria-hidden />
                  <select
                    aria-label={d.toolbar.code}
                    className="bg-transparent outline-none"
                    value=""
                    onChange={(e) => e.target.value && insert(codeSnippet(e.target.value === "plain" ? "" : e.target.value))}
                  >
                    <option value="">{d.toolbar.code}</option>
                    {CODE_LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                    <option value="plain">{d.toolbar.plain}</option>
                  </select>
                </label>
              </div>
              <textarea
                id="body"
                ref={bodyRef}
                className={`${inputClass} mt-2 h-[60vh] resize-y font-mono leading-relaxed`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className={tab === "preview" ? "" : "hidden lg:block"}>
              <p className="text-sm font-medium">{d.tabs.preview}</p>
              <div className="mt-2 h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 lg:mt-[2.375rem] dark:border-slate-800 dark:bg-slate-950">
                {body.trim() ? (
                  <article lang="en" className={proseClass}>
                    <Markdown content={body} lang={lang} />
                  </article>
                ) : (
                  <p className="text-sm text-slate-400">{d.previewEmpty}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? d.submitting : d.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  extra,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  extra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {error ? (
          <span role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {error}
          </span>
        ) : (
          hint && <span className="text-xs text-slate-500">{hint}</span>
        )}
        {extra}
      </div>
    </div>
  );
}
```

注意：若 `lucide-react` 当前版本没有 `Heading2`、`Code`，`npm run typecheck` 会报错；改用该版本中存在的同义图标（例如 `Heading`、`CodeXml`），不要新增依赖。

- [ ] **Step 4: 页面**

`app/[lang]/new/page.tsx`：

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/article-editor";
import { getCategories } from "@/lib/categories.server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { formatLocalDate, isAuthoringEnabled } from "@/lib/new-article";

// 每次请求渲染：默认日期取当天，生产环境直接 404
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) && isAuthoringEnabled() ? { title: getDictionary(lang).editor.title } : {};
}

export default async function NewArticlePage({ params }: Props) {
  const { lang } = await params;
  if (!isAuthoringEnabled() || !isLocale(lang)) notFound();
  const categories = getCategories().map((c) => ({ id: c.id, label: c.label[lang] }));
  return <ArticleEditor lang={lang} categories={categories} today={formatLocalDate(new Date())} />;
}
```

- [ ] **Step 5: 顶栏按钮**

在 `app/[lang]/layout.tsx` 中：

import 行改为：

```tsx
import { LifeBuoy, SquarePen } from "lucide-react";
```

并新增：

```tsx
import { isAuthoringEnabled } from "@/lib/new-article";
```

把顶栏右侧的

```tsx
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-slate-500 md:block">
                {d.site.supportPrefix} {d.site.supportLabel} · {d.site.supportContact}
              </span>
              <LanguageSwitcher lang={lang} />
            </div>
```

改为：

```tsx
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-slate-500 md:block">
                {d.site.supportPrefix} {d.site.supportLabel} · {d.site.supportContact}
              </span>
              {isAuthoringEnabled() && (
                <Link
                  href={localePath(lang, "/new")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm text-white transition hover:bg-sky-700"
                >
                  <SquarePen className="size-4" aria-hidden />
                  <span className="hidden sm:inline">{d.editor.navButton}</span>
                </Link>
              )}
              <LanguageSwitcher lang={lang} />
            </div>
```

（若 `SquarePen` 不存在，改用 `PenSquare` 或 `Pencil`。）

- [ ] **Step 6: 类型检查、单元测试与生产构建**

Run: `npm run typecheck && npm test && npm run build`
Expected: 全部通过；构建输出中 `/[lang]/new` 为 `ƒ (Dynamic)`

- [ ] **Step 7: 生产模式确认不可用**

Run（Git Bash）：

```bash
npx next start -p 3457 > /dev/null 2>&1 &
for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:3457/ && break; sleep 1; done
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3457/new      # 期望 404
curl -s http://localhost:3457/ | grep -c 'href="/new"'                    # 期望 0
```

结束后停止该进程（PowerShell：`Get-NetTCPConnection -LocalPort 3457 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`）。

- [ ] **Step 8: 开发模式浏览器验收**

Run: `npm run dev`（后台运行），用浏览器（Playwright MCP 或手动）逐项检查：

1. 首页顶栏出现 "New article" 按钮，点击进入 `/new`；`/zh/new` 显示中文界面
2. 输入标题 `Test Article: Special #1` → 文件名自动变为 `test-article-special-1`；手动改文件名后，再改标题，文件名不再变化
3. 标题输入 `显示器无信号` 且文件名为空时，提示"请手动填写文件名"
4. 文件名改为 `vpn-connection`，约 300ms 后提示"已存在"并建议 `vpn-connection-2`，点击"使用"即填入
5. 标签框：输入 `monitor` 回车、粘贴 `a, b`、用中文输入法输入"显示器"并回车选词（不应提前生成拼音标签）、输入 `last` 后不按回车直接点创建 → 生成的文件包含 `last`
6. 在标题框按回车不会提交
7. 工具栏插入"步骤 / 章节 / WARNING 提示框 / powershell 代码块"，右侧预览与正式文章页样式一致
8. 必填项留空点击创建 → 对应字段显示"此项必填"，已填内容保留
9. 填写完整并点击创建 → 跳转到 `/articles/<slug>`，分类、标签、日期、步骤数正确；`content/articles/<slug>.md` 的 frontmatter 格式与现有文章一致
10. 有未保存内容时点击左侧目录的文章链接 → 弹出确认；取消后留在本页，内容不丢；点击语言切换并确认 → 只弹一次确认

验收后删除测试生成的文章文件（不要提交它们）。

- [ ] **Step 9: 提交**

```bash
git add lib/i18n.ts "app/[lang]/new" components/article-editor.tsx "app/[lang]/layout.tsx"
git commit -m "feat(new): 开发模式下的新建文章页面 /new"
```

---

### Task 7: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新"新建文章"一节**

在 `README.md` 的 `### 新建文章` 标题下方、现有步骤 `1. 复制 content/articles/_template.md…` 之前插入：

````markdown
**推荐：使用图形界面（仅本机开发模式）**

```bash
npm run dev
```

打开 http://localhost:3000/new（或点击顶栏的 **New article**），填写标题、摘要、分类、标签和正文，右侧会实时预览。点击 **Create** 后自动生成 `content/articles/<文件名>.md`，并跳转到新文章页面，确认无误后用 Git 提交即可。

- 文件名根据标题自动生成，也可以手动修改；同名文章已存在时不会覆盖，并会提示可用的名称
- 该页面只在 `npm run dev` 下可用，生产环境（`npm run start` / Docker）访问会返回 404

**手动方式：**

````

在 `## 1. 本地开发` 的"其他命令"代码块中加入一行：

```bash
npm test             # 运行单元测试（Vitest）
```

在"目录结构"中 `app/[lang]/` 下加入：

```
│   │   ├── new/                      # 新建文章页面与 Server Actions（仅开发模式）
```

在 `components/` 下加入：

```
│   ├── article-editor.tsx        # 新建文章表单与实时预览（客户端）
```

在 `lib/` 下加入：

```
│   ├── new-article.ts            # 新建文章：slug、校验、frontmatter 生成
│   ├── article-files.ts          # 新建文章：查重与写入（不覆盖）
│   ├── editor-snippets.ts        # 正文工具栏片段
```

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: README 加入新建文章图形界面说明"
```
