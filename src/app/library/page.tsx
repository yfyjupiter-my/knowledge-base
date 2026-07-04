import { Topbar } from "@/components/ui/Topbar";
import { Sidebar } from "@/components/ui/Sidebar";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChip } from "@/components/ui/FilterChip";
import { ActiveFilters } from "@/components/ui/ActiveFilters";
import { Pagination } from "@/components/ui/Pagination";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DocumentTable } from "@/components/screens/DocumentTable";
import { AppFooter } from "@/components/screens/AppFooter";
import { UserMenu } from "@/components/screens/UserMenu";
import Link from "next/link";
import { getDocuments } from "@/lib/data";
import { categories, categoryBySlug } from "@/lib/categories";
import { filterDocuments, paginate, toQueryParams, PAGE_SIZE } from "@/lib/query";
import { auth } from "@/auth";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [session, resolvedParams] = await Promise.all([auth(), searchParams]);
  const params = toQueryParams(resolvedParams);

  const documents = await getDocuments(session?.user?.email ?? undefined);
  const favorites = documents.filter((doc) => doc.favorited);
  const filtered = filterDocuments(documents, params);
  const { items, currentPage, totalPages, totalCount } = paginate(
    filtered,
    Number(params.page ?? 1),
    PAGE_SIZE,
  );

  const activeCategory = categoryBySlug(params.category);
  const heading = params.favorites === "1"
    ? "Favorites"
    : activeCategory?.sidebarLabel ?? "All Documents";
  const statusNote =
    params.status === "published" || params.status === "draft"
      ? ` · showing ${params.status} only`
      : "";

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        center={
          <SearchBar
            key={params.q ?? ""}
            placeholder="Search by title, body, or tag…"
            className="w-[420px]"
            params={params}
          />
        }
        right={<UserMenu name={session?.user?.name} email={session?.user?.email} />}
      />
      <div className="grid flex-1 grid-cols-[240px_1fr]">
        <Sidebar params={params} favorites={favorites} />
        <div className="p-7">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold text-text">{heading}</h1>
              <p className="mt-1 text-xs text-text-muted">
                {totalCount.toLocaleString()} {totalCount === 1 ? "document" : "documents"}
                {statusNote}
              </p>
            </div>
            <Link href="/docs/new">
              <Button variant="primary">+ New Document</Button>
            </Link>
          </div>
          <div className="mb-4 flex gap-2.5">
            <FilterChip
              label="Category"
              paramKey="category"
              params={params}
              options={[
                { label: "All categories" },
                ...categories.map((c) => ({ label: c.sidebarLabel, value: c.slug })),
              ]}
            />
            <FilterChip
              label="Status"
              paramKey="status"
              params={params}
              options={[
                { label: "Any status" },
                { label: "Published", value: "published" },
                { label: "Draft", value: "draft" },
              ]}
            />
            <FilterChip
              label="Last reviewed"
              paramKey="reviewed"
              params={params}
              options={[
                { label: "Any time" },
                { label: "Overdue", value: "overdue" },
              ]}
            />
          </div>
          <ActiveFilters params={params} />
          <Panel className="overflow-hidden">
            <DocumentTable documents={items} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              params={params}
            />
          </Panel>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
