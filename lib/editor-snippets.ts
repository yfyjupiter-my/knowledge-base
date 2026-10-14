/** /admin 正文工具栏：在光标处插入块级 Markdown 片段，选中的文字会被包裹在片段中 */

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
