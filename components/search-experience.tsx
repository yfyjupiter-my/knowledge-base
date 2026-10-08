"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Fuse, { type FuseResult, type FuseResultMatch, type IFuseOptions, type Expression } from "fuse.js";
import { Search, SearchX, X } from "lucide-react";
import { ArticleCard } from "./article-card";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import type { SearchDoc } from "@/lib/articles";
import { SITE } from "@/lib/site";

const KEYS = [
  { name: "title", weight: 3 },
  { name: "tags", weight: 2 },
  { name: "summary", weight: 1.5 },
  { name: "body", weight: 1 },
] as const;

const FUSE_OPTIONS: IFuseOptions<SearchDoc> = {
  keys: KEYS.map((k) => ({ ...k })),
  threshold: 0.3,
  // 正文较长，关闭位置权重，任意位置命中都算
  ignoreLocation: true,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 1,
};

type Indices = readonly [number, number][];

/** 只保留足够长的命中片段，避免单字模糊匹配导致满屏高亮 */
function usefulIndices(match: FuseResultMatch | undefined, minLen: number): Indices {
  return (match?.indices ?? []).filter(([s, e]) => e - s + 1 >= minLen);
}

function highlight(text: string, indices: Indices, offset = 0): ReactNode {
  if (!indices.length) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [rawStart, rawEnd] of [...indices].sort((a, b) => a[0] - b[0])) {
    const start = Math.max(rawStart - offset, cursor);
    const end = Math.min(rawEnd - offset, text.length - 1);
    if (end < start) continue;
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className="rounded-sm bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-400/30">
        {text.slice(start, end + 1)}
      </mark>,
    );
    cursor = end + 1;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function bodySnippet(body: string, indices: Indices): ReactNode | undefined {
  if (!indices.length) return undefined;
  const [s, e] = [...indices].sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  const from = Math.max(0, s - 30);
  const to = Math.min(body.length, e + 50);
  const window = body.slice(from, to);
  const inWindow = indices.filter(([a, b]) => a >= from && b < to);
  return (
    <>
      {from > 0 && "…"}
      {highlight(window, inWindow, from)}
      {to < body.length && "…"}
    </>
  );
}

function buildQuery(query: string): string | Expression {
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return query;
  // 多个关键词：每个词都需命中任一字段
  return { $and: tokens.map((t) => ({ $or: KEYS.map((k) => ({ [k.name]: t })) })) };
}

export function SearchExperience({ docs }: { docs: SearchDoc[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim());

  const fuse = useMemo(() => new Fuse(docs, FUSE_OPTIONS), [docs]);

  // 从 URL 恢复状态（?q=&c=），便于分享搜索结果
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    const c = params.get("c");
    if (c && CATEGORIES.some((x) => x.id === c)) setCategory(c as CategoryId);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredQuery) params.set("q", deferredQuery);
    if (category !== "all") params.set("c", category);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [deferredQuery, category]);

  // 按 "/" 聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { results, elapsed } = useMemo(() => {
    const start = performance.now();
    let list: FuseResult<SearchDoc>[];
    if (deferredQuery) {
      list = fuse.search(buildQuery(deferredQuery));
    } else {
      list = docs.map((item, refIndex) => ({ item, refIndex, matches: [] }));
    }
    if (category !== "all") list = list.filter((r) => r.item.category === category);
    return { results: list, elapsed: performance.now() - start };
  }, [fuse, docs, deferredQuery, category]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of docs) map.set(d.category, (map.get(d.category) ?? 0) + 1);
    return map;
  }, [docs]);

  const minLen = Math.min(2, deferredQuery.replace(/\s/g, "").length || 1);

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-sky-50 to-slate-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-12 text-center sm:pt-16">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">遇到问题？先搜一搜</h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
            输入现象、错误码或关键词，按步骤自助排查常见 IT 问题
          </p>

          <div className="relative mx-auto mt-8 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="例如：VPN 连不上、809、打印机脱机…"
              aria-label="搜索知识库"
              autoComplete="off"
              autoFocus
              className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-20 text-base shadow-lg shadow-sky-900/5 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {query ? (
                <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="清空搜索">
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="hidden rounded-md border border-slate-200 px-2 py-0.5 font-mono text-xs text-slate-400 sm:inline dark:border-slate-700">/</kbd>
              )}
            </div>
          </div>

          <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:justify-center" role="group" aria-label="按分类筛选">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")} label="全部" count={docs.length} />
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(category === c.id ? "all" : c.id)}
                label={c.label}
                count={counts.get(c.id) ?? 0}
                dotClass={c.dotClass}
                title={c.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300" aria-live="polite">
            {deferredQuery ? <>找到 <span className="font-semibold text-slate-900 dark:text-white">{results.length}</span> 篇相关文章</> : category === "all" ? "全部文章" : `${CATEGORIES.find((c) => c.id === category)?.label} · ${results.length} 篇`}
          </h2>
          {deferredQuery && <span className="font-mono text-xs text-slate-400">{elapsed.toFixed(2)} ms</span>}
        </div>

        {results.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ item, matches }) => {
              const find = (key: string) => matches?.find((m) => m.key === key);
              const titleIdx = usefulIndices(find("title"), minLen);
              const summaryIdx = usefulIndices(find("summary"), minLen);
              const bodyIdx = usefulIndices(find("body"), minLen);
              return (
                <li key={item.slug}>
                  <ArticleCard
                    article={item}
                    title={highlight(item.title, titleIdx)}
                    summary={item.summary ? highlight(item.summary, summaryIdx) : undefined}
                    snippet={!titleIdx.length && !summaryIdx.length ? bodySnippet(item.body, bodyIdx) : undefined}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
            <SearchX className="mx-auto size-10 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">没有找到相关文章</p>
            <p className="mt-1 text-sm text-slate-500">
              试试更换关键词或清除分类筛选；仍无法解决请联系{SITE.support.label}（{SITE.support.contact}）
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function FilterChip(props: { active: boolean; onClick: () => void; label: string; count: number; dotClass?: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      aria-pressed={props.active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
        props.active
          ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {props.dotClass && <span className={`size-2 rounded-full ${props.dotClass}`} aria-hidden />}
      {props.label}
      <span className={`text-xs tabular-nums ${props.active ? "opacity-70" : "text-slate-400"}`}>{props.count}</span>
    </button>
  );
}
