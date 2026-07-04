import type { Document } from "./mock-data";
import { categoryBySlug } from "./categories";

export interface QueryParams {
  q?: string;
  category?: string;
  tag?: string;
  status?: string;
  favorites?: string;
  reviewed?: string;
  page?: string;
}

export const PAGE_SIZE = 3;

export const FILTER_PARAM_KEYS = [
  "q",
  "category",
  "tag",
  "status",
  "favorites",
  "reviewed",
] as const satisfies readonly (keyof QueryParams)[];

/** Normalize Next.js searchParams (string | string[] | undefined) to single values. */
export function toQueryParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): QueryParams {
  const params: QueryParams = {};
  for (const key of [...FILTER_PARAM_KEYS, "page"] as const) {
    const value = searchParams[key];
    params[key] = Array.isArray(value) ? value[0] : value;
  }
  return params;
}

export function filterDocuments(docs: Document[], params: QueryParams): Document[] {
  let result = docs;

  const category = categoryBySlug(params.category);
  if (category) {
    result = result.filter((doc) => doc.category === category.docCategory);
  }
  if (params.tag) {
    result = result.filter((doc) => doc.tags.includes(params.tag!));
  }
  if (params.status === "published" || params.status === "draft") {
    result = result.filter((doc) => doc.status === params.status);
  }
  if (params.favorites === "1") {
    result = result.filter((doc) => doc.favorited);
  }
  if (params.reviewed === "overdue") {
    result = result.filter((doc) => doc.reviewOverdue);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    result = result.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.subtitle.toLowerCase().includes(q) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }
  return result;
}

export interface PaginatedResult {
  items: Document[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function paginate(
  docs: Document[],
  page: number,
  pageSize: number = PAGE_SIZE,
): PaginatedResult {
  const totalCount = docs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: docs.slice(start, start + pageSize),
    currentPage,
    totalPages,
    totalCount,
  };
}

/**
 * Build an `/library` href from the current params plus overrides.
 * An override of `undefined` removes the param; any filter change resets `page`.
 */
export function buildHref(
  current: QueryParams,
  overrides: Partial<QueryParams>,
): string {
  const merged: QueryParams = { ...current, ...overrides };
  if (!("page" in overrides)) {
    delete merged.page;
  }
  const qs = new URLSearchParams();
  for (const key of [...FILTER_PARAM_KEYS, "page"] as const) {
    const value = merged[key];
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `/library?${s}` : "/library";
}
