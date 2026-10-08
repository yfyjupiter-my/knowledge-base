"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { CircleCheckBig, RotateCcw } from "lucide-react";
import { SITE } from "@/lib/site";

interface ChecklistState {
  checked: Set<number>;
  total: number;
  updatedAt: number | null;
  toggle: (index: number) => void;
  reset: () => void;
  register: (index: number) => () => void;
}

const ChecklistContext = createContext<ChecklistState | null>(null);

function useChecklist() {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error("Checklist 组件必须位于 <ChecklistProvider> 内");
  return ctx;
}

interface Stored {
  checked: number[];
  updatedAt: number;
}

/**
 * 排查进度保存在浏览器 localStorage 中（每位员工独立、无需登录）。
 * storageKey 包含文章更新日期：文章修改后步骤可能变化，进度自动重置。
 */
export function ChecklistProvider({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [registered, setRegistered] = useState<Set<number>>(() => new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        const data: Stored | null = raw ? JSON.parse(raw) : null;
        setChecked(new Set(data?.checked ?? []));
        setUpdatedAt(data?.updatedAt ?? null);
      } catch {
        setChecked(new Set());
      }
      setLoaded(true);
    };
    load();
    // 同一文章在多个标签页打开时保持同步
    const onStorage = (e: StorageEvent) => e.key === storageKey && load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<number>) => {
      const now = Date.now();
      setChecked(next);
      setUpdatedAt(next.size ? now : null);
      try {
        if (next.size) localStorage.setItem(storageKey, JSON.stringify({ checked: [...next], updatedAt: now }));
        else localStorage.removeItem(storageKey);
      } catch {
        // 隐私模式等场景下 localStorage 不可用，仅保留内存状态
      }
    },
    [storageKey],
  );

  const toggle = useCallback(
    (index: number) => {
      const next = new Set(checked);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      persist(next);
    },
    [checked, persist],
  );

  const reset = useCallback(() => persist(new Set()), [persist]);

  const register = useCallback((index: number) => {
    setRegistered((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
    return () =>
      setRegistered((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
  }, []);

  const value = useMemo<ChecklistState>(() => {
    // 忽略已不存在的步骤序号（例如旧数据）
    const valid = new Set([...checked].filter((i) => registered.has(i)));
    return { checked: loaded ? valid : new Set(), total: registered.size, updatedAt, toggle, reset, register };
  }, [checked, registered, loaded, updatedAt, toggle, reset, register]);

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
}

export function ChecklistItem({ index, children }: { index: number; children: ReactNode }) {
  const { checked, toggle, register } = useChecklist();
  useEffect(() => register(index), [index, register]);
  const done = checked.has(index);

  function handleRowClick(e: MouseEvent<HTMLLIElement>) {
    const target = e.target as HTMLElement;
    // 点击链接、按钮、代码块或正在选择文本（如复制命令）时不切换状态
    if (target.closest("a, button, input, pre")) return;
    if (window.getSelection()?.toString()) return;
    toggle(index);
  }

  return (
    <li
      onClick={handleRowClick}
      data-done={done || undefined}
      className="checklist-item group/item -mx-3 flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100/80 data-done:bg-emerald-50/60 dark:hover:bg-white/5 dark:data-done:bg-emerald-400/5"
    >
      <input
        type="checkbox"
        checked={done}
        onChange={() => toggle(index)}
        aria-label={`步骤 ${index + 1}`}
        className="mt-[0.3em] size-[1.1rem] shrink-0 cursor-pointer accent-emerald-600"
      />
      <div className="min-w-0 flex-1 transition-opacity group-data-done/item:line-through group-data-done/item:opacity-50 [&>p]:my-0 [&>ul]:my-1">
        {children}
      </div>
    </li>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString("zh-CN", sameDay ? { hour: "2-digit", minute: "2-digit" } : { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ChecklistProgress({ variant }: { variant: "card" | "bar" }) {
  const { checked, total, updatedAt, reset } = useChecklist();
  if (total === 0) return null;
  const done = checked.size;
  const percent = Math.round((done / total) * 100);
  const complete = done === total;

  const bar = (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="排查进度">
      <div className={`h-full rounded-full transition-[width] duration-500 ${complete ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${percent}%` }} />
    </div>
  );

  const resetButton = done > 0 && (
    <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200">
      <RotateCcw className="size-3" aria-hidden /> 重置
    </button>
  );

  if (variant === "bar") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {complete ? <span className="text-emerald-600 dark:text-emerald-400">已完成</span> : `${done}/${total}`}
          </span>
          <div className="flex-1">{bar}</div>
          {resetButton}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">排查进度</h2>
        {resetButton}
      </div>
      <p className="mb-3 text-2xl font-semibold tabular-nums">
        {done}
        <span className="text-base font-normal text-slate-400"> / {total} 步</span>
      </p>
      {bar}
      <p className="mt-2 text-xs text-slate-500">
        {updatedAt ? `进度已自动保存 · ${formatTime(updatedAt)}` : "勾选已完成的步骤，进度会保存在本机浏览器"}
      </p>
      {complete && (
        <div className="mt-3 flex gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CircleCheckBig className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            所有步骤已完成。问题仍未解决？请联系{SITE.support.label}（{SITE.support.contact}），并告知已完成本指南的排查。
          </span>
        </div>
      )}
    </div>
  );
}
