import type { DocCategoryLabel } from "./mock-data";

export interface Category {
  slug: string;
  sidebarLabel: string;
  docCategory: DocCategoryLabel;
}

export const categories: Category[] = [
  { slug: "technical-guides", sidebarLabel: "Technical Guides", docCategory: "Tech Guide" },
  { slug: "system-config", sidebarLabel: "System Configuration", docCategory: "Sys Config" },
  { slug: "compliance", sidebarLabel: "Compliance", docCategory: "Compliance" },
];

export function categoryBySlug(slug: string | undefined): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
