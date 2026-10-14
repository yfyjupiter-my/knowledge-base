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
