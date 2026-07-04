import Link from "next/link";
import { buildHref, type QueryParams } from "@/lib/query";

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  params = {},
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  params?: QueryParams;
}) {
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const pageHref = (page: number) =>
    buildHref(params, { page: page > 1 ? String(page) : undefined });

  return (
    <div className="flex items-center gap-1.5 px-4.5 py-3.5 text-sm text-text-muted">
      {currentPage > 1 ? (
        <Link href={pageHref(currentPage - 1)} className="rounded px-2 py-1 hover:text-text">
          ‹ Prev
        </Link>
      ) : (
        <span className="px-2 py-1 opacity-50">‹ Prev</span>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
        page === currentPage ? (
          <span key={page} className="rounded bg-primary px-2 py-1 text-primary-fg">
            {page}
          </span>
        ) : (
          <Link key={page} href={pageHref(page)} className="rounded px-2 py-1 hover:text-text">
            {page}
          </Link>
        ),
      )}
      {currentPage < totalPages ? (
        <Link href={pageHref(currentPage + 1)} className="rounded px-2 py-1 hover:text-text">
          Next ›
        </Link>
      ) : (
        <span className="px-2 py-1 opacity-50">Next ›</span>
      )}
      <span className="flex-1" />
      <span>
        Showing {start}–{end} of {totalCount}
      </span>
    </div>
  );
}
