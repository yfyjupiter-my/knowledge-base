import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/article-editor";
import { getAllArticles } from "@/lib/articles";
import { getCategories } from "@/lib/categories.server";
import { HTML_LANG, getDictionary, isLocale, localePath } from "@/lib/i18n";
import { articleFileName } from "@/lib/article-files";
import { formatLocalDate, isAuthoringEnabled } from "@/lib/new-article";

// 每次请求渲染：默认日期取当天，生产环境直接 404
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) && isAuthoringEnabled() ? { title: getDictionary(lang).editor.title } : {};
}

export default async function NewArticlePage({ params }: Props) {
  const { lang } = await params;
  if (!isAuthoringEnabled() || !isLocale(lang)) notFound();
  const categories = getCategories().map((c) => ({ id: c.id, label: c.label[lang] }));
  const articles = [...getAllArticles(lang)].sort((a, b) => a.title.localeCompare(b.title, lang === "zh" ? "zh-CN" : "en"));
  // 编辑入口只在 /admin：文章页不显示编辑按钮
  const existing = (
    <details className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{getDictionary(lang).editor.editExisting(articles.length)}</summary>
      <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto border-t border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
        {articles.map((a) => (
          <li key={a.slug}>
            {/* 普通 <a> 整页加载，与顶栏入口一致；站内点击仍经过编辑器的离开确认 */}
            <a
              href={localePath(lang, `/admin/edit/${encodeURIComponent(a.slug)}`)}
              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span lang={HTML_LANG[a.contentLocale]} className="truncate">
                {a.title}
              </span>
              <span className="shrink-0 font-mono text-xs text-slate-500">{articleFileName(a.slug, a.contentLocale)}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
  return <ArticleEditor lang={lang} categories={categories} today={formatLocalDate(new Date())} aside={existing} />;
}
