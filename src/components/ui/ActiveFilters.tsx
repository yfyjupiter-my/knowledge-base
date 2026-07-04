import Link from "next/link";
import { categoryBySlug } from "@/lib/categories";
import { buildHref, FILTER_PARAM_KEYS, type QueryParams } from "@/lib/query";

function describe(key: (typeof FILTER_PARAM_KEYS)[number], value: string): string {
  switch (key) {
    case "q":
      return `Search: “${value}”`;
    case "category":
      return `Category: ${categoryBySlug(value)?.sidebarLabel ?? value}`;
    case "tag":
      return `Tag: ${value}`;
    case "status":
      return `Status: ${value === "published" ? "Published" : "Draft"}`;
    case "favorites":
      return "Favorites only";
    case "reviewed":
      return "Review overdue";
  }
}

export function ActiveFilters({ params }: { params: QueryParams }) {
  const active = FILTER_PARAM_KEYS.filter((key) => params[key]);
  if (active.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-text-muted">Active filters:</span>
      {active.map((key) => (
        <Link
          key={key}
          href={buildHref(params, { [key]: undefined })}
          className="flex items-center gap-1.5 rounded-kb border border-primary bg-surface px-2.5 py-1 text-xs text-primary hover:bg-surface-alt"
        >
          {describe(key, params[key]!)}
          <span aria-hidden>✕</span>
        </Link>
      ))}
      <Link href="/library" className="text-xs text-text-muted underline hover:text-text">
        Clear all
      </Link>
    </div>
  );
}
