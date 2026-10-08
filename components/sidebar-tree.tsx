"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, House, Search } from "lucide-react";
import { getCategory, type CategoryId } from "@/lib/categories";
import type { TreeArticle, TreeCategory } from "@/lib/articles";
import { HTML_LANG, getDictionary, localePath, stripLocale, type Locale } from "@/lib/i18n";
import { onCategoryChange, requestSearch, type CategoryFilter } from "@/lib/search-events";

const COLLAPSED_KEY = "kb:tree-collapsed";

function matches(article: TreeArticle, words: string[]) {
  const hay = `${article.title} ${article.tags.join(" ")}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

function highlight(text: string, words: string[]): ReactNode {
  if (!words.length) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    i % 2 ? (
      <mark key={i} className="rounded-sm bg-amber-200/70 text-inherit dark:bg-amber-400/30">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/** 当前文章的二级标题中，最后一个滚过视口顶部的那个 */
function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!ids.length) return;
    const update = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        // 锚点跳转后标题停在约 160px 处（scroll-padding-top + scroll-mt），判定线需低于它
        if (el && el.getBoundingClientRect().top < 200) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? ids[ids.length - 1] : current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // 点击目录锚点时立即更新，不必等下一次滚动事件
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", update);
    };
  }, [ids]);
  return active;
}

interface SidebarTreeProps {
  lang: Locale;
  tree: TreeCategory[];
  /** 只给常驻侧栏开启，避免抽屉里的副本重复响应快捷键 */
  shortcut?: boolean;
  /** 点击任一链接后的回调（移动端用于关闭抽屉） */
  onNavigate?: () => void;
}

export function SidebarTree({ lang, tree, shortcut, onNavigate }: SidebarTreeProps) {
  const d = getDictionary(lang);
  const router = useRouter();
  const path = stripLocale(usePathname());
  const isHome = path === "/";
  const currentSlug = path.startsWith("/articles/") ? decodeURIComponent(path.slice("/articles/".length)) : null;
  const homeHref = localePath(lang, "/");

  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Set<CategoryId>>(() => new Set());
  const [homeCategory, setHomeCategory] = useState<CategoryFilter>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // 折叠状态在挂载后再读取，避免与服务端渲染结果不一致
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (raw) setCollapsed(new Set(JSON.parse(raw)));
    } catch {
      // localStorage 不可用时全部展开
    }
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const c = new URLSearchParams(window.location.search).get("c");
    setHomeCategory(c && getCategory(c as CategoryId).id === c ? (c as CategoryId) : "all");
    return onCategoryChange(setHomeCategory);
  }, [isHome]);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && inputRef.current?.offsetParent) {
        e.preventDefault();
        inputRef.current.focus();
        inputRef.current.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const words = useMemo(() => filter.trim().toLowerCase().split(/\s+/).filter(Boolean), [filter]);
  const visible = useMemo(
    () => tree.map((c) => ({ ...c, articles: c.articles.filter((a) => matches(a, words)) })).filter((c) => !words.length || c.articles.length),
    [tree, words],
  );
  const current = useMemo(() => tree.flatMap((c) => c.articles).find((a) => a.slug === currentSlug) ?? null, [tree, currentSlug]);
  const headingIds = useMemo(() => current?.headings.map((h) => h.id) ?? [], [current]);
  const activeHeading = useActiveHeading(headingIds);

  const total = tree.reduce((n, c) => n + c.articles.length, 0);
  const latest = tree.flatMap((c) => c.articles.map((a) => a.updated)).sort().at(-1);

  function toggle(id: CategoryId) {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
    } catch {
      // 仅保留内存状态
    }
  }

  /** 已在首页时不跳转，直接通知搜索组件切换分类 */
  function selectCategory(e: MouseEvent, c: CategoryFilter) {
    if (isHome) {
      e.preventDefault();
      requestSearch(c === "all" ? { c, q: "" } : { c });
    }
    onNavigate?.();
  }

  function submitFilter() {
    const q = filter.trim();
    if (!q) return;
    setFilter("");
    onNavigate?.();
    if (isHome) requestSearch({ q, c: "all" });
    else router.push(`${homeHref}?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-2 pt-3">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-slate-400 transition focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-500/15 dark:border-slate-700 dark:bg-slate-900">
          <Search className="size-4 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitFilter();
              if (e.key === "Escape") setFilter("");
            }}
            placeholder={d.nav.filter}
            aria-label={d.nav.filterAria}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {shortcut && !filter && (
            <kbd className="shrink-0 rounded border border-slate-200 px-1.5 font-mono text-[11px] text-slate-400 dark:border-slate-700">Ctrl K</kbd>
          )}
        </label>
      </div>

      <nav aria-label={d.nav.aria} className="flex-1 overflow-y-auto overscroll-contain px-2 pb-6 pt-1">
        <Link
          href={homeHref}
          onClick={(e) => selectCategory(e, "all")}
          aria-current={isHome && homeCategory === "all" ? "page" : undefined}
          className="mb-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 aria-[current]:bg-sky-50 aria-[current]:font-medium aria-[current]:text-sky-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white dark:aria-[current]:bg-sky-400/10 dark:aria-[current]:text-sky-300"
        >
          <House className="size-4" aria-hidden />
          {d.search.allArticles}
        </Link>

        {visible.length === 0 && <p className="px-2 py-4 text-sm text-slate-500">{d.nav.empty}</p>}

        <ul className="space-y-2.5">
          {visible.map((group) => {
            const c = getCategory(group.id);
            const label = c.label[lang];
            const open = words.length > 0 || !collapsed.has(group.id);
            const count = tree.find((t) => t.id === group.id)?.articles.length ?? 0;
            const listId = `tree-${group.id}`;
            const categoryActive = isHome && homeCategory === group.id;
            return (
              <li key={group.id}>
                <div className="flex items-center rounded-md hover:bg-slate-200/60 dark:hover:bg-white/5">
                  <button
                    type="button"
                    onClick={() => toggle(group.id)}
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-label={d.nav.toggle(label)}
                    className="grid h-7 w-6 shrink-0 place-items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden />
                  </button>
                  <Link
                    href={`${homeHref}?c=${group.id}`}
                    onClick={(e) => selectCategory(e, group.id)}
                    aria-current={categoryActive ? "page" : undefined}
                    title={c.description[lang]}
                    className="flex h-7 min-w-0 flex-1 items-center gap-2 pr-2 text-xs font-semibold uppercase tracking-wide text-slate-500 aria-[current]:text-sky-700 dark:text-slate-400 dark:aria-[current]:text-sky-300"
                  >
                    <span className={`size-2 shrink-0 rounded-full ${c.dotClass}`} aria-hidden />
                    <span className="truncate">{label}</span>
                    <span className="ml-auto text-[11px] font-medium normal-case tracking-normal tabular-nums text-slate-400">{count}</span>
                  </Link>
                </div>

                <ul id={listId} hidden={!open} className="ml-[18px] mt-0.5 border-l border-slate-200 pl-2 dark:border-slate-800">
                  {group.articles.map((a) => {
                    const active = a.slug === currentSlug;
                    return (
                      <li key={a.slug}>
                        <Link
                          href={localePath(lang, `/articles/${encodeURIComponent(a.slug)}`)}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          lang={HTML_LANG[a.contentLocale]}
                          className="-ml-[9px] block rounded-r-md border-l-2 border-transparent py-1.5 pl-2.5 pr-2 text-sm leading-snug text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 aria-[current]:border-sky-600 aria-[current]:bg-sky-50 aria-[current]:font-medium aria-[current]:text-sky-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white dark:aria-[current]:border-sky-400 dark:aria-[current]:bg-sky-400/10 dark:aria-[current]:text-sky-300"
                        >
                          {highlight(a.title, words)}
                        </Link>
                        {active && a.headings.length > 0 && (
                          <ul aria-label={d.article.toc} lang={HTML_LANG[a.contentLocale]} className="mb-1.5 ml-2.5 mt-0.5 border-l border-slate-200 dark:border-slate-800">
                            {a.headings.map((h) => (
                              <li key={h.id}>
                                <a
                                  href={`#${h.id}`}
                                  onClick={onNavigate}
                                  aria-current={activeHeading === h.id ? "location" : undefined}
                                  className="-ml-px block border-l-2 border-transparent py-1 pl-3 pr-2 text-[13px] leading-snug text-slate-500 hover:text-slate-900 aria-[current]:border-sky-500 aria-[current]:font-medium aria-[current]:text-slate-900 dark:hover:text-white dark:aria-[current]:border-sky-400 dark:aria-[current]:text-white"
                                >
                                  {h.text}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>

      {latest && (
        <p className="border-t border-slate-200 px-4 py-2.5 text-xs text-slate-400 dark:border-slate-800">
          {d.nav.summary(total, latest)}
        </p>
      )}
    </div>
  );
}
