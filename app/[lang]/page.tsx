import { notFound } from "next/navigation";
import { SearchExperience } from "@/components/search-experience";
import { getSearchDocs } from "@/lib/articles";
import { getCategories } from "@/lib/categories.server";
import { isLocale } from "@/lib/i18n";

// 每 60 秒按需重新读取 Markdown，修改文档后无需重新构建
export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <SearchExperience lang={lang} docs={getSearchDocs(lang)} categories={getCategories()} />;
}
