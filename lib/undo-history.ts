/**
 * 正文编辑器的撤销历史。
 * 工具栏和图片插入是程序化修改 textarea 的值，浏览器原生撤销栈不会记录，
 * 因此由编辑器自己维护一份快照历史。
 */

export type HistoryEntry = { text: string; cursor: number };
export type History = { past: HistoryEntry[]; present: HistoryEntry; future: HistoryEntry[] };

export const HISTORY_LIMIT = 200;

export function createHistory(text: string, cursor = 0): History {
  return { past: [], present: { text, cursor }, future: [] };
}

/** merge 为 true 时替换当前快照（连续打字合并为一步），否则作为新的一步 */
export function record(h: History, entry: HistoryEntry, { merge }: { merge: boolean }): History {
  if (entry.text === h.present.text) return { ...h, present: entry };
  if (merge) return { ...h, present: entry, future: [] };
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: entry, future: [] };
}

export function undo(h: History): History {
  const prev = h.past.at(-1);
  if (!prev) return h;
  return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] };
}

export function redo(h: History): History {
  const [next, ...future] = h.future;
  if (!next) return h;
  return { past: [...h.past, h.present], present: next, future };
}

/** 对所有快照应用同一变换（例如把上传占位替换为图片），不新增历史 */
export function transformAll(h: History, fn: (text: string) => string): History {
  const map = (e: HistoryEntry): HistoryEntry => {
    const text = fn(e.text);
    return text === e.text ? e : { text, cursor: Math.min(e.cursor, text.length) };
  };
  return { past: h.past.map(map), present: map(h.present), future: h.future.map(map) };
}
