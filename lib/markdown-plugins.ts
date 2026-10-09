import { visit } from "unist-util-visit";
import type { Root as MdastRoot, Blockquote } from "mdast";

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
