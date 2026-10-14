import { describe, expect, it } from "vitest";
import { HISTORY_LIMIT, createHistory, record, redo, transformAll, undo } from "./undo-history";

describe("undo-history", () => {
  it("record → undo → redo 往返", () => {
    let h = createHistory("a", 1);
    h = record(h, { text: "ab", cursor: 2 }, { merge: false });
    h = undo(h);
    expect(h.present).toEqual({ text: "a", cursor: 1 });
    h = redo(h);
    expect(h.present).toEqual({ text: "ab", cursor: 2 });
  });

  it("栈空时 undo / redo 原样返回", () => {
    const h = createHistory("a");
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it("撤销后再修改会清空重做", () => {
    let h = record(createHistory(""), { text: "a", cursor: 1 }, { merge: false });
    h = record(undo(h), { text: "b", cursor: 1 }, { merge: false });
    expect(h.future).toEqual([]);
    expect(redo(h).present.text).toBe("b");
  });

  it("连续打字合并为一步，程序化插入单独一步", () => {
    let h = createHistory("");
    h = record(h, { text: "a", cursor: 1 }, { merge: false });
    h = record(h, { text: "ab", cursor: 2 }, { merge: true });
    h = record(h, { text: "ab\n## ", cursor: 6 }, { merge: false });
    h = undo(h);
    expect(h.present.text).toBe("ab");
    h = undo(h);
    expect(h.present.text).toBe("");
  });

  it("文本未变时只更新光标，不新增一步", () => {
    const h = record(createHistory("a", 0), { text: "a", cursor: 1 }, { merge: false });
    expect(h.past).toEqual([]);
    expect(h.present.cursor).toBe(1);
  });

  it("占位替换为图片后，撤销直接回到插入前", () => {
    const placeholder = "![上传中 cat](#upload-1)";
    let h = createHistory("x", 1);
    h = record(h, { text: `x\n${placeholder}`, cursor: 2 + placeholder.length }, { merge: false });
    h = transformAll(h, (t) => t.replace(placeholder, "![cat](/images/cat.png)"));
    expect(h.present.text).toBe("x\n![cat](/images/cat.png)");
    h = undo(h);
    expect(h.present.text).toBe("x");
    h = redo(h);
    expect(h.present.text).toBe("x\n![cat](/images/cat.png)");
  });

  it("transformAll 也修改重做中的快照，并把光标限制在文本长度内", () => {
    let h = record(createHistory(""), { text: "PLACEHOLDER", cursor: 11 }, { merge: false });
    h = transformAll(undo(h), (t) => t.replace("PLACEHOLDER", ""));
    expect(redo(h).present).toEqual({ text: "", cursor: 0 });
  });

  it(`最多保留 ${HISTORY_LIMIT} 步`, () => {
    let h = createHistory("");
    for (let i = 1; i <= HISTORY_LIMIT + 10; i++) h = record(h, { text: String(i), cursor: 0 }, { merge: false });
    expect(h.past).toHaveLength(HISTORY_LIMIT);
  });
});
