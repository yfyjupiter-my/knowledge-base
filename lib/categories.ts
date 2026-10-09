import type { Locale } from "./i18n";

/** 分类 id 来自 content/categories.yml，"other" 为内置的未归类分类 */
export type CategoryId = string;

export const OTHER_ID = "other";

/** Tailwind 类名需为完整字面量，便于构建时扫描，因此颜色只能从预设色板中选择 */
export const COLORS = {
  sky: { badgeClass: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/30", dotClass: "bg-sky-500" },
  violet: { badgeClass: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/30", dotClass: "bg-violet-500" },
  amber: { badgeClass: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/30", dotClass: "bg-amber-500" },
  rose: { badgeClass: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/30", dotClass: "bg-rose-500" },
  emerald: { badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/30", dotClass: "bg-emerald-500" },
  teal: { badgeClass: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/30", dotClass: "bg-teal-500" },
  cyan: { badgeClass: "bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/30", dotClass: "bg-cyan-500" },
  indigo: { badgeClass: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/30", dotClass: "bg-indigo-500" },
  pink: { badgeClass: "bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-400/10 dark:text-pink-300 dark:ring-pink-400/30", dotClass: "bg-pink-500" },
  orange: { badgeClass: "bg-orange-50 text-orange-800 ring-orange-600/20 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/30", dotClass: "bg-orange-500" },
  lime: { badgeClass: "bg-lime-50 text-lime-800 ring-lime-600/20 dark:bg-lime-400/10 dark:text-lime-300 dark:ring-lime-400/30", dotClass: "bg-lime-500" },
  slate: { badgeClass: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/30", dotClass: "bg-slate-400" },
} as const;

export type CategoryColor = keyof typeof COLORS;

export interface Category {
  id: CategoryId;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  badgeClass: string;
  dotClass: string;
}

export const OTHER: Category = {
  id: OTHER_ID,
  label: { zh: "其他", en: "Other" },
  description: { zh: "未归类的问题", en: "Uncategorized issues" },
  ...COLORS.slate,
};

/** frontmatter 的 category 可写 id（network）、中文名（网络连接）或英文名（Network） */
export function resolveCategory(value: unknown, categories: Category[]): Category {
  if (typeof value !== "string") return OTHER;
  const v = value.trim().toLowerCase();
  return (
    categories.find((c) => c.id === v || c.label.zh === value.trim() || c.label.en.toLowerCase() === v) ?? OTHER
  );
}

/** 已删除或不存在的分类 id 回退为"其他" */
export function getCategory(id: CategoryId, categories: Category[]): Category {
  return categories.find((c) => c.id === id) ?? OTHER;
}
