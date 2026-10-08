import { SearchExperience } from "@/components/search-experience";
import { getSearchDocs } from "@/lib/articles";

// 每 60 秒按需重新读取 Markdown，修改文档后无需重新构建
export const revalidate = 60;

export default function HomePage() {
  return <SearchExperience docs={getSearchDocs()} />;
}
