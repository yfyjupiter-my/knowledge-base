import type { Locale } from "./i18n";

export type CategoryId = "network" | "account" | "software" | "hardware" | "other";

export interface Category {
  id: CategoryId;
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  /** Tailwind 类名需为完整字面量，便于构建时扫描 */
  badgeClass: string;
  dotClass: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "network",
    label: { zh: "网络连接", en: "Network" },
    description: { zh: "VPN、Wi-Fi、内网访问、DNS", en: "VPN, Wi-Fi, intranet access, DNS" },
    badgeClass: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/30",
    dotClass: "bg-sky-500",
  },
  {
    id: "account",
    label: { zh: "账号权限", en: "Accounts & Access" },
    description: { zh: "登录、密码、MFA、权限申请", en: "Sign-in, passwords, MFA, permissions" },
    badgeClass: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/30",
    dotClass: "bg-violet-500",
  },
  {
    id: "software",
    label: { zh: "软件报错", en: "Software Errors" },
    description: { zh: "办公软件、客户端、系统报错", en: "Office apps, clients, system errors" },
    badgeClass: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/30",
    dotClass: "bg-amber-500",
  },
  {
    id: "hardware",
    label: { zh: "硬件故障", en: "Hardware" },
    description: { zh: "打印机、显示器、外设、电脑", en: "Printers, monitors, peripherals, PCs" },
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/30",
    dotClass: "bg-rose-500",
  },
];

const OTHER: Category = {
  id: "other",
  label: { zh: "其他", en: "Other" },
  description: { zh: "未归类的问题", en: "Uncategorized issues" },
  badgeClass: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/30",
  dotClass: "bg-slate-400",
};

/** frontmatter 的 category 可写 id（network）、中文名（网络连接）或英文名（Network） */
export function resolveCategory(value: unknown): Category {
  if (typeof value !== "string") return OTHER;
  const v = value.trim().toLowerCase();
  return (
    CATEGORIES.find((c) => c.id === v || c.label.zh === value.trim() || c.label.en.toLowerCase() === v) ?? OTHER
  );
}

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? OTHER;
}
