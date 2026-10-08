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

interface ArticleCardProps {
  article: ArticleMeta;
  lang: Locale;
  /** 可传入带高亮的标题/摘要 */
  title?: ReactNode;
  summary?: ReactNode;
  snippet?: ReactNode;
}

export function ArticleCard({ article, lang, title, summary, snippet }: ArticleCardProps) {
  return (
    <Link
      href={localePath(lang, `/articles/${encodeURIComponent(article.slug)}`)}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <CategoryBadge id={article.category} lang={lang} />
        {article.fallback && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Languages className="size-3.5" aria-hidden />
            {getDictionary(lang).meta.untranslated}
          </span>
        )}
      </div>
      <h3 lang={HTML_LANG[article.contentLocale]} className="text-base font-semibold leading-snug text-slate-900 group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-300">
        {title ?? article.title}
      </h3>
      {(summary ?? article.summary) && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{summary ?? article.summary}</p>
      )}
      {snippet && (
        <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <span className="line-clamp-2">{snippet}</span>
        </p>
      )}
      {article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {article.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <ArticleMetaRow article={article} lang={lang} className="mt-auto pt-4" />
    </Link>
  );
}
