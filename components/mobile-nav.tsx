"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { TreeCategory } from "@/lib/articles";
import { getDictionary, type Locale } from "@/lib/i18n";
import { SidebarTree } from "./sidebar-tree";

/** 小屏下的目录：顶栏 ☰ 按钮 + 左侧抽屉，大屏隐藏（由常驻侧栏代替） */
export function MobileNav({ lang, tree }: { lang: Locale; tree: TreeCategory[] }) {
  const d = getDictionary(lang).nav;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const close = () => window.matchMedia("(min-width: 1024px)").matches && setOpen(false);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={d.open}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="-ml-2 grid size-9 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* 顶栏的 backdrop-blur 会让 fixed 子元素相对顶栏定位，因此抽屉挂到 body 下 */}
      {mounted &&
        createPortal(
          <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
            <div
              onClick={() => setOpen(false)}
              className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
            />
            <div
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label={d.title}
              inert={!open}
              className={`absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-slate-50 shadow-xl transition-transform duration-200 dark:bg-slate-900 ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 pl-4 pr-2 dark:border-slate-800">
                <span className="font-semibold">{d.title}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={d.close}
                  className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/10"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <SidebarTree lang={lang} tree={tree} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
