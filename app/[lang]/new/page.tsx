import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/article-editor";
import { getCategories } from "@/lib/categories.server";
import { getDictionary, isLocale } from "@/lib/i18n";
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
  return <ArticleEditor lang={lang} categories={categories} today={formatLocalDate(new Date())} />;
}
