import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LifeBuoy, SquarePen } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarTree } from "@/components/sidebar-tree";
import { getArticleTree } from "@/lib/articles";
import { getCategories } from "@/lib/categories.server";
import { HTML_LANG, LOCALES, getDictionary, isLocale, localePath } from "@/lib/i18n";
import { isAuthoringEnabled } from "@/lib/new-article";
import "highlight.js/styles/github-dark.css";
import "../globals.css";

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDictionary(lang);
  return {
    title: { default: d.site.fullName, template: `%s · ${d.site.name}` },
    description: d.site.description,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const tree = getArticleTree(lang);
  const categories = getCategories();

  return (
    <html lang={HTML_LANG[lang]}>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
            <MobileNav lang={lang} tree={tree} categories={categories} authoring={isAuthoringEnabled()} />
            <Link href={localePath(lang, "/")} className="mr-auto flex min-w-0 items-center gap-2 font-semibold">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-600 text-white">
                <LifeBuoy className="size-5" aria-hidden />
              </span>
              <span className="truncate">{d.site.name}</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-slate-500 md:block">
                {d.site.supportPrefix} {d.site.supportLabel} · {d.site.supportContact}
              </span>
              {isAuthoringEnabled() && (
                // 普通 <a> 整页加载：从 /admin 后退时会离开文档并触发 beforeunload 确认
                <a
                  href={localePath(lang, "/admin")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-2.5 py-1.5 text-sm text-white transition hover:bg-sky-700"
                >
                  <SquarePen className="size-4" aria-hidden />
                  <span className="hidden sm:inline">{d.editor.navButton}</span>
                </a>
              )}
              <LanguageSwitcher lang={lang} />
            </div>
          </div>
        </header>
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] border-r border-slate-200 bg-slate-50 lg:block dark:border-slate-800 dark:bg-slate-900/40">
            <SidebarTree lang={lang} tree={tree} categories={categories} authoring={isAuthoringEnabled()} shortcut />
          </aside>
          <div className="flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col bg-white dark:bg-slate-950">
            <main className="flex-1">{children}</main>
            <footer className="mx-4 border-t border-slate-200 py-6 text-xs text-slate-500 sm:mx-8 lg:mx-10 dark:border-slate-800">
              {d.site.fullName} · {d.site.footer} <code className="font-mono">content/articles</code>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
