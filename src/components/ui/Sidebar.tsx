import Link from "next/link";
import { Tag } from "./Tag";
import { categories } from "@/lib/categories";
import { buildHref, type QueryParams } from "@/lib/query";
import { sidebarTags, type Document } from "@/lib/mock-data";

export function Sidebar({
  params = {},
  favorites = [],
}: {
  params?: QueryParams;
  favorites?: Document[];
}) {
  const categoryEntries = [
    { slug: undefined as string | undefined, label: "All Documents" },
    ...categories.map((c) => ({ slug: c.slug as string | undefined, label: c.sidebarLabel })),
  ];

  return (
    <div className="border-r border-border bg-surface px-3.5 py-5">
      <h4 className="mb-2 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted first:mt-0">
        Categories
      </h4>
      {categoryEntries.map(({ slug, label }) => {
        const active = (params.category ?? undefined) === slug;
        return (
          <Link
            key={label}
            href={buildHref(params, { category: slug })}
            className={`mb-0.5 flex items-center gap-2 rounded-kb px-2.5 py-2 text-sm ${
              active ? "bg-primary text-primary-fg" : "text-text-muted hover:text-text"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
            {label}
          </Link>
        );
      })}

      <h4 className="mb-2 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Tags
      </h4>
      <div className="flex flex-wrap gap-1.5 px-2">
        {sidebarTags.map((tag) => {
          const active = params.tag === tag;
          return (
            <Link key={tag} href={buildHref(params, { tag: active ? undefined : tag })}>
              <Tag className={active ? "border-primary text-primary" : undefined}>{tag}</Tag>
            </Link>
          );
        })}
      </div>

      <h4 className="mb-2 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Favorites
      </h4>
      <Link
        href={buildHref(params, { favorites: params.favorites === "1" ? undefined : "1" })}
        className={`mb-0.5 flex items-center gap-2 rounded-kb px-2.5 py-2 text-sm ${
          params.favorites === "1" ? "bg-primary text-primary-fg" : "text-text-muted hover:text-text"
        }`}
      >
        ★ Favorites only
      </Link>
      {favorites.map((doc) => (
        <Link
          key={doc.id}
          href={`/docs/${doc.id}`}
          className="mb-0.5 flex items-center gap-2 rounded-kb px-2.5 py-2 text-sm text-text hover:text-primary"
        >
          ★ {doc.title}
        </Link>
      ))}

      <h4 className="mb-2 mt-4 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Region
      </h4>
      {/* Read-only: seed data only has "Global" (out of scope until multi-region data exists) */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-text">
        <input type="checkbox" defaultChecked readOnly />
        All regions
      </div>
    </div>
  );
}
