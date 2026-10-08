import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllArticles, getArticle } from "@/lib/articles";
import { ArticleMetaRow, CategoryBadge } from "@/components/article-card";
import { ChecklistProgress, ChecklistProvider } from "@/components/checklist";
import { Markdown } from "@/components/markdown";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle((await params).slug);
  return article ? { title: article.title, description: article.summary } : {};
}

export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const hasSteps = article.stepCount > 0;

  return (
    <ChecklistProvider storageKey={`kb:checklist:${article.slug}:${article.updated}`}>
      <div className={`mx-auto max-w-6xl px-4 py-6 sm:py-10 ${hasSteps ? "pb-24 lg:pb-10" : ""}`}>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="size-4" aria-hidden /> 返回搜索
        </Link>

        <header className="mt-4 max-w-3xl">
          <CategoryBadge id={article.category} />
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{article.title}</h1>
          {article.summary && <p className="mt-3 text-slate-600 dark:text-slate-400">{article.summary}</p>}
          <ArticleMetaRow article={article} className="mt-4" />
          {article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 dark:prose-h2:border-slate-800 prose-a:text-sky-700 dark:prose-a:text-sky-400 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-slate-800 prose-table:text-sm">
            <Markdown content={article.content} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              {hasSteps && <ChecklistProgress variant="card" />}
              {article.headings.length > 0 && (
                <nav aria-label="本文目录">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">本文目录</h2>
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
