import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Languages } from "lucide-react";
import { getAllArticles, getArticle } from "@/lib/articles";
import { getCategory } from "@/lib/categories";
import { getCategories } from "@/lib/categories.server";
import { HTML_LANG, LOCALES, getDictionary, isLocale, localePath, type Locale } from "@/lib/i18n";
import { ArticleMetaRow, CategoryBadge } from "@/components/article-card";
import { ChecklistProgress, ChecklistProvider } from "@/components/checklist";
import { Markdown } from "@/components/markdown";

export const revalidate = 60;

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return isLocale(params.lang) ? getAllArticles(params.lang).map((a) => ({ slug: a.slug })) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const article = isLocale(lang) ? getArticle(lang, slug) : null;
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [HTML_LANG[l], localePath(l, `/articles/${encodeURIComponent(article.slug)}`)]),
      ),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const article = getArticle(lang, slug);
  if (!article) notFound();
  const d = getDictionary(lang);
  const hasSteps = article.stepCount > 0;
  const contentLang: Locale = article.contentLocale;
  const category = getCategory(article.category, getCategories());

  return (
    <ChecklistProvider lang={lang} storageKey={`kb:checklist:${article.slug}:${contentLang}:${article.updated}`}>
      <div className={`mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10 lg:mx-0 lg:px-10 ${hasSteps ? "pb-28" : ""}`}>
        <nav aria-label={d.article.breadcrumb}>
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-500">
            <li>
              <Link href={localePath(lang, "/")} className="hover:text-slate-900 dark:hover:text-white">
                {d.search.allArticles}
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5 text-slate-400" aria-hidden />
              <Link href={`${localePath(lang, "/")}?c=${article.category}`} className="hover:text-slate-900 dark:hover:text-white">
                {category.label[lang]}
              </Link>
            </li>
            <li className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              <span aria-current="page" lang={HTML_LANG[contentLang]} className="truncate text-slate-700 dark:text-slate-300">
                {article.title}
              </span>
            </li>
          </ol>
        </nav>

        {article.fallback && d.article.fallbackNotice && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            <Languages className="mt-0.5 size-4 shrink-0" aria-hidden />
            {d.article.fallbackNotice}
          </p>
        )}

        <header className="mt-5 border-b border-slate-200 pb-6 dark:border-slate-800" lang={HTML_LANG[contentLang]}>
          <CategoryBadge category={category} lang={lang} />
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{article.title}</h1>
          {article.summary && <p className="mt-3 text-slate-600 dark:text-slate-400">{article.summary}</p>}
          <ArticleMetaRow article={article} lang={lang} className="mt-4" />
          {article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Link key={tag} href={`${localePath(lang, "/")}?q=${encodeURIComponent(tag)}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <article lang={HTML_LANG[contentLang]} className="prose prose-slate mt-6 max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 dark:prose-h2:border-slate-800 prose-a:text-sky-700 dark:prose-a:text-sky-400 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-slate-800 prose-table:text-sm">
          <Markdown content={article.content} lang={lang} />
        </article>
      </div>
      {hasSteps && <ChecklistProgress />}
    </ChecklistProvider>
  );
}
