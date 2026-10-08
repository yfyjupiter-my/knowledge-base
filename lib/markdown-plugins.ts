import { visit } from "unist-util-visit";
import type { Root as MdastRoot, Blockquote } from "mdast";
import type { Root as HastRoot, Element, ElementContent } from "hast";

export const CALLOUT_TYPES = ["note", "tip", "important", "warning", "caution"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

const CALLOUT_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*([^\n]*)\n?/i;

/**
 * GitHub 风格警告框：
 *   > [!WARNING] 可选标题
 *   > 内容
 * 转换为带 data-callout 属性的 blockquote，由 <Callout> 组件渲染。
 */
export function remarkCallout() {
  return (tree: MdastRoot) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0];
      if (first?.type !== "paragraph") return;
      const text = first.children[0];
      if (text?.type !== "text") return;
      const m = CALLOUT_RE.exec(text.value);
      if (!m) return;

      text.value = text.value.slice(m[0].length);
      if (!text.value) {
        first.children.shift();
        // 去掉标记后紧跟的换行
        if (first.children[0]?.type === "break") first.children.shift();
        if (first.children.length === 0) node.children.shift();
      }

      node.data = {
        ...node.data,
        hProperties: {
          dataCallout: m[1].toLowerCase(),
          ...(m[2].trim() ? { dataCalloutTitle: m[2].trim() } : {}),
        },
      };
    });
  };
}

function removeFirstCheckbox(parent: Element): boolean | null {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i] as ElementContent;
    if (child.type !== "element") continue;
    if (child.tagName === "input" && child.properties?.type === "checkbox") {
      parent.children.splice(i, 1);
      return Boolean(child.properties.checked);
    }
    // 松散列表中复选框位于 <p> 内
    if (child.tagName === "p") {
      const found = removeFirstCheckbox(child);
      if (found !== null) return found;
    }
  }
  return null;
}

/**
 * 为 GFM 任务列表项（- [ ] 步骤）编号并移除静态复选框，
 * 由客户端 <ChecklistItem> 渲染为可交互、可持久化的排查步骤。
 */
export function rehypeChecklist() {
  return (tree: HastRoot) => {
    let index = 0;
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "li") return;
      const cls = node.properties?.className;
      if (!Array.isArray(cls) || !cls.includes("task-list-item")) return;
      if (removeFirstCheckbox(node) === null) return;
      // 进度只记录在用户本地，Markdown 中写的 [x] 不作为初始勾选状态
      node.properties = { ...node.properties, dataTaskIndex: index++ };
    });
  };
}
