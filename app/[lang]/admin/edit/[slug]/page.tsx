import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/article-editor";
import { articleFileName, parseArticleMarkdown, readArticleFile } from "@/lib/article-files";
import { ARTICLES_DIR, getArticle } from "@/lib/articles";
import { OTHER_ID } from "@/lib/categories";
import { getCategories } from "@/lib/categories.server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { formatLocalDate, isAuthoringEnabled } from "@/lib/new-article";

// 每次请求读取最新文件：编辑页记录的指纹必须对应当前内容
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) && isAuthoringEnabled() ? { title: getDictionary(lang).editor.editTitle } : {};
}

export default async function EditArticlePage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isAuthoringEnabled() || !isLocale(lang)) notFound();
  // 编辑当前语言实际显示的版本：没有译文时编辑回退显示的原文
  const article = getArticle(lang, slug);
  if (!article) notFound();
  const file = await readArticleFile(ARTICLES_DIR, article.slug, article.contentLocale);
  if (!file) notFound();

  // 文章里的分类可以写 id、中文名或英文名，下拉框需要 id；"其他"不是可选项，留空让用户重新选择
  const values = { ...parseArticleMarkdown(file.raw), category: article.category === OTHER_ID ? "" : article.category };
  const categories = getCategories().map((c) => ({ id: c.id, label: c.label[lang] }));
  return (
    <ArticleEditor
      lang={lang}
      categories={categories}
      today={formatLocalDate(new Date())}
      edit={{ slug: article.slug, locale: article.contentLocale, file: articleFileName(article.slug, article.contentLocale), hash: file.hash, values }}
    />
  );
}
