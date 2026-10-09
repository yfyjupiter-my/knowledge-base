"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Fuse, { type FuseResult, type FuseResultMatch, type IFuseOptions, type Expression } from "fuse.js";
import { Search, SearchX, X } from "lucide-react";
import { ArticleRow } from "./article-card";
import { getCategory, type Category } from "@/lib/categories";
import type { SearchDoc } from "@/lib/articles";
import { getDictionary, type Locale } from "@/lib/i18n";
import { announceCategory, onSearchRequest, type CategoryFilter } from "@/lib/search-events";

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

export function SearchExperience({ lang, docs, categories }: { lang: Locale; docs: SearchDoc[]; categories: Category[] }) {
  const d = getDictionary(lang);
  const t = d.search;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim());

  const fuse = useMemo(() => new Fuse(docs, FUSE_OPTIONS), [docs]);

  // 从 URL 恢复状态（?q=&c=），便于分享搜索结果
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    const c = params.get("c");
    if (c && categories.some((x) => x.id === c)) setCategory(c);
  }, [categories]);

  // 已在首页时，侧栏通过事件切换分类或提交搜索
  useEffect(
    () =>
      onSearchRequest(({ q, c }) => {
        if (q !== undefined) setQuery(q);
        if (c) setCategory(c);
        if (q) inputRef.current?.focus();
      }),
    [],
  );

  useEffect(() => announceCategory(category), [category]);

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

  const activeCategory = category === "all" ? null : categories.find((c) => c.id === category);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10 lg:mx-0 lg:px-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {activeCategory ? activeCategory.label[lang] : t.heading}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
          {activeCategory ? activeCategory.description[lang] : t.subheading}
        </p>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder={t.placeholder}
            aria-label={t.aria}
            autoComplete="off"
            autoFocus
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-16 text-base outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white [&::-webkit-search-cancel-button]:hidden"
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {query ? (
              <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label={t.clear}>
                <X className="size-4" />
              </button>
            ) : (
              <kbd className="hidden rounded-md border border-slate-200 px-2 py-0.5 font-mono text-xs text-slate-400 sm:inline dark:border-slate-700">/</kbd>
            )}
          </div>
        </div>

        {/* 大屏由左侧目录树筛选分类；小屏目录收在抽屉里，因此保留分类按钮 */}
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden" role="group" aria-label={t.filterAria}>
          <FilterChip active={category === "all"} onClick={() => setCategory("all")} label={t.all} count={docs.length} />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(category === c.id ? "all" : c.id)}
              label={c.label[lang]}
              count={counts.get(c.id) ?? 0}
              dotClass={c.dotClass}
              title={c.description[lang]}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300" aria-live="polite">
            {deferredQuery
              ? t.found(results.length)
              : activeCategory
                ? t.inCategory(activeCategory.label[lang], results.length)
                : t.recent}
          </h2>
          <div className="flex items-center gap-3">
            {deferredQuery && <span className="font-mono text-xs text-slate-400">{elapsed.toFixed(2)} ms</span>}
            {activeCategory && (
              <button
                type="button"
                onClick={() => setCategory("all")}
                aria-label={t.clearCategory}
                className="hidden items-center gap-1 rounded-md bg-sky-50 py-0.5 pl-2 pr-1 text-xs font-medium text-sky-700 hover:bg-sky-100 lg:inline-flex dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20"
              >
                {activeCategory.label[lang]}
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {results.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {results.map(({ item, matches }) => {
              const find = (key: string) => matches?.find((m) => m.key === key);
              const titleIdx = usefulIndices(find("title"), minLen);
              const summaryIdx = usefulIndices(find("summary"), minLen);
              const bodyIdx = usefulIndices(find("body"), minLen);
              return (
                <li key={item.slug}>
                  <ArticleRow
                    article={item}
                    category={getCategory(item.category, categories)}
                    lang={lang}
                    title={highlight(item.title, titleIdx)}
                    summary={item.summary ? highlight(item.summary, summaryIdx) : undefined}
                    snippet={!titleIdx.length && !summaryIdx.length ? bodySnippet(item.body, bodyIdx) : undefined}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
            <SearchX className="mx-auto size-10 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">{t.emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{t.emptyHint(d.site.support)}</p>
          </div>
        )}
      </section>
    </div>
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
