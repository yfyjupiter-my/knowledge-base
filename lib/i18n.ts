export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";
/** 记住用户上次选择的语言 */
export const LOCALE_COOKIE = "kb-lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** 中文为默认语言、不带前缀；英文使用 /en 前缀 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** 去掉路径中的语言前缀，得到与语言无关的路径 */
export function stripLocale(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

/** 求助渠道：按公司实际情况修改 */
const SUPPORT_CONTACT = "it-helpdesk@example.com";
const SUPPORT_EXT = "8000";

export const HTML_LANG: Record<Locale, string> = { zh: "zh-CN", en: "en" };

const zh = {
  site: {
    name: "IT 知识库",
    fullName: "IT 知识库与故障排查",
    description: "公司内部常见问题检索与分步排查指南",
    supportPrefix: "需要人工帮助？",
    supportLabel: "IT 服务台",
    supportContact: `分机 ${SUPPORT_EXT} · ${SUPPORT_CONTACT}`,
    /** 用于句中引用 */
    support: `IT 服务台（分机 ${SUPPORT_EXT} · ${SUPPORT_CONTACT}）`,
    footer: "文档维护于",
  },
  switcher: { label: "English", aria: "切换到英文" },
  search: {
    heading: "遇到问题？先搜一搜",
    subheading: "输入现象、错误码或关键词，按步骤自助排查常见 IT 问题",
    placeholder: "例如：VPN 连不上、809、打印机脱机…",
    aria: "搜索知识库",
    clear: "清空搜索",
    filterAria: "按分类筛选",
    all: "全部",
    allArticles: "全部文章",
    found: (n: number) => `找到 ${n} 篇相关文章`,
    inCategory: (label: string, n: number) => `${label} · ${n} 篇`,
    emptyTitle: "没有找到相关文章",
    emptyHint: (support: string) => `试试更换关键词或清除分类筛选；仍无法解决请联系${support}`,
  },
  meta: {
    steps: (n: number) => `${n} 个排查步骤`,
    minutes: (n: number) => `约 ${n} 分钟`,
    untranslated: "仅中文",
  },
  article: {
    back: "返回搜索",
    toc: "本文目录",
    fallbackNotice: "",
  },
  checklist: {
    title: "排查进度",
    unit: "步",
    reset: "重置",
    done: "已完成",
    step: (n: number) => `步骤 ${n}`,
    saved: (time: string) => `进度已自动保存 · ${time}`,
    hint: "勾选已完成的步骤，进度会保存在本机浏览器",
    complete: (support: string) => `所有步骤已完成。问题仍未解决？请联系${support}，并告知已完成本指南的排查。`,
    aria: "排查进度",
  },
  code: { copy: "复制", copied: "已复制", failed: "复制失败，请手动选择", aria: "复制代码" },
  callout: { note: "说明", tip: "提示", important: "重要", warning: "警告", caution: "危险操作" },
  notFound: {
    title: "文章不存在或已被移除",
    hint: "链接可能已失效，试试在首页重新搜索。",
    home: "返回首页",
  },
};

export type Dictionary = typeof zh;

const en: Dictionary = {
  site: {
    name: "IT Knowledge Base",
    fullName: "IT Knowledge Base & Troubleshooting",
    description: "Search common IT issues and follow step-by-step troubleshooting guides",
    supportPrefix: "Need a human?",
    supportLabel: "IT Service Desk",
    supportContact: `ext. ${SUPPORT_EXT} · ${SUPPORT_CONTACT}`,
    support: `the IT Service Desk (ext. ${SUPPORT_EXT} · ${SUPPORT_CONTACT})`,
    footer: "Docs maintained in",
  },
  switcher: { label: "中文", aria: "Switch to Chinese" },
  search: {
    heading: "Having an issue? Search first",
    subheading: "Type a symptom, error code or keyword and troubleshoot common IT issues step by step",
    placeholder: "e.g. VPN won't connect, 809, printer offline…",
    aria: "Search the knowledge base",
    clear: "Clear search",
    filterAria: "Filter by category",
    all: "All",
    allArticles: "All articles",
    found: (n: number) => `${n} matching article${n === 1 ? "" : "s"}`,
    inCategory: (label: string, n: number) => `${label} · ${n} article${n === 1 ? "" : "s"}`,
    emptyTitle: "No matching articles",
    emptyHint: (support: string) => `Try different keywords or clear the category filter. Still stuck? Contact ${support}`,
  },
  meta: {
    steps: (n: number) => `${n} step${n === 1 ? "" : "s"}`,
    minutes: (n: number) => `${n} min read`,
    untranslated: "Chinese only",
  },
  article: {
    back: "Back to search",
    toc: "On this page",
    fallbackNotice: "This article has not been translated into English yet. The Chinese version is shown below.",
  },
  checklist: {
    title: "Progress",
    unit: "steps",
    reset: "Reset",
    done: "Done",
    step: (n: number) => `Step ${n}`,
    saved: (time: string) => `Progress saved · ${time}`,
    hint: "Tick each step as you finish it. Progress is saved in this browser.",
    complete: (support: string) => `All steps done. Still not fixed? Contact ${support} and mention you have completed this guide.`,
    aria: "Troubleshooting progress",
  },
  code: { copy: "Copy", copied: "Copied", failed: "Copy failed, select manually", aria: "Copy code" },
  callout: { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution" },
  notFound: {
    title: "Article not found",
    hint: "The link may be outdated. Try searching from the home page.",
    home: "Back to home",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

