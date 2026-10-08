import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HTML_LANG, LOCALES, getDictionary, isLocale, localePath } from "@/lib/i18n";
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

  return (
    <html lang={HTML_LANG[lang]}>
      <body className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
            <Link href={localePath(lang, "/")} className="flex min-w-0 items-center gap-2 font-semibold">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-600 text-white">
                <LifeBuoy className="size-5" aria-hidden />
              </span>
              <span className="truncate">{d.site.name}</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-slate-500 md:block">
                {d.site.supportPrefix} {d.site.supportLabel} · {d.site.supportContact}
              </span>
              <LanguageSwitcher lang={lang} />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
          {d.site.fullName} · {d.site.footer} <code className="font-mono">content/articles</code>
        </footer>
      </body>
    </html>
  );
}
