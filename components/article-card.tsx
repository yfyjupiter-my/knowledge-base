import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Clock, Languages, ListChecks } from "lucide-react";
import { getCategory } from "@/lib/categories";
import type { ArticleMeta } from "@/lib/articles";
import { HTML_LANG, getDictionary, localePath, type Locale } from "@/lib/i18n";

export function CategoryBadge({ id, lang }: { id: ArticleMeta["category"]; lang: Locale }) {
  const c = getCategory(id);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${c.badgeClass}`}>
      <span className={`size-1.5 rounded-full ${c.dotClass}`} aria-hidden />
      {c.label[lang]}
    </span>
  );
}

export function ArticleMetaRow({ article, lang, className = "" }: { article: ArticleMeta; lang: Locale; className?: string }) {
  const d = getDictionary(lang).meta;
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      {article.stepCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <ListChecks className="size-3.5" aria-hidden />
          {d.steps(article.stepCount)}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        {d.minutes(article.readingMinutes)}
      </span>
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="size-3.5" aria-hidden />
        <time dateTime={article.updated}>{article.updated}</time>
      </span>
    </div>
  );
}

interface ArticleRowProps {
  article: ArticleMeta;
  lang: Locale;
  /** 可传入带高亮的标题/摘要 */
  title?: ReactNode;
  summary?: ReactNode;
  snippet?: ReactNode;
}

/** 首页列表中的一行：与左侧目录树同样紧凑的视觉密度 */
export function ArticleRow({ article, lang, title, summary, snippet }: ArticleRowProps) {
  const c = getCategory(article.category);
  return (
    <Link
      href={localePath(lang, `/articles/${encodeURIComponent(article.slug)}`)}
      className="group -mx-3 flex gap-3 rounded-lg px-3 py-3.5 transition-colors hover:bg-slate-100/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:hover:bg-white/5"
    >
      <span className={`mt-[0.55rem] size-2 shrink-0 rounded-full ${c.dotClass}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h3 lang={HTML_LANG[article.contentLocale]} className="min-w-0 flex-1 font-medium leading-snug text-slate-900 group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-300">
            {title ?? article.title}
          </h3>
          {article.fallback && (
            <span className="hidden shrink-0 items-center gap-1 text-xs text-slate-400 sm:inline-flex">
              <Languages className="size-3.5" aria-hidden />
              {getDictionary(lang).meta.untranslated}
            </span>
          )}
          <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{c.label[lang]}</span>
          <time dateTime={article.updated} className="shrink-0 text-xs tabular-nums text-slate-400">
            {article.updated}
          </time>
        </div>
        {(summary ?? article.summary) && (
          <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{summary ?? article.summary}</p>
        )}
        {snippet && (
          <p className="mt-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <span className="line-clamp-2">{snippet}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
