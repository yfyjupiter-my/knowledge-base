import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Languages } from "lucide-react";
import { getAllArticles, getArticle } from "@/lib/articles";
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

  return (
    <ChecklistProvider lang={lang} storageKey={`kb:checklist:${article.slug}:${contentLang}:${article.updated}`}>
      <div className={`mx-auto max-w-6xl px-4 py-6 sm:py-10 ${hasSteps ? "pb-24 lg:pb-10" : ""}`}>
        <Link href={localePath(lang, "/")} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="size-4" aria-hidden /> {d.article.back}
        </Link>

        {article.fallback && d.article.fallbackNotice && (
          <p className="mt-4 flex max-w-3xl items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            <Languages className="mt-0.5 size-4 shrink-0" aria-hidden />
            {d.article.fallbackNotice}
          </p>
        )}

        <header className="mt-4 max-w-3xl" lang={HTML_LANG[contentLang]}>
          <CategoryBadge id={article.category} lang={lang} />
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

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article lang={HTML_LANG[contentLang]} className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 dark:prose-h2:border-slate-800 prose-a:text-sky-700 dark:prose-a:text-sky-400 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-slate-800 prose-table:text-sm">
            <Markdown content={article.content} lang={lang} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              {hasSteps && <ChecklistProgress variant="card" />}
              {article.headings.length > 0 && (
                <nav aria-label={d.article.toc}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{d.article.toc}</h2>
                  <ul className="space-y-1 border-l border-slate-200 text-sm dark:border-slate-800">
                    {article.headings.map((h) => (
                      <li key={h.id}>
                        <a href={`#${h.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </aside>
        </div>
      </div>
      {hasSteps && <ChecklistProgress variant="bar" />}
    </ChecklistProvider>
  );
}
