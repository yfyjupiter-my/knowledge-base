import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { SITE } from "@/lib/site";
import "highlight.js/styles/github-dark.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE.fullName, template: `%s · ${SITE.name}` },
  description: SITE.description,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-sky-600 text-white">
                <LifeBuoy className="size-5" aria-hidden />
              </span>
              {SITE.name}
            </Link>
            <span className="hidden text-sm text-slate-500 sm:block">
              需要人工帮助？{SITE.support.label} · {SITE.support.contact}
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
          {SITE.fullName} · 文档维护于 <code className="font-mono">content/articles</code>
        </footer>
      </body>
    </html>
  );
}
