"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE, getDictionary, localePath, stripLocale, type Locale } from "@/lib/i18n";

/** 切换到另一种语言的同一页面，保留搜索参数，并记住选择 */
export function LanguageSwitcher({ lang }: { lang: Locale }) {
  const target: Locale = lang === "zh" ? "en" : "zh";
  const d = getDictionary(lang);
  const [href, setHref] = useState(localePath(target, "/"));

  useEffect(() => {
    // 在客户端读取地址栏，避免与中间件重写后的内部路径混淆
    const update = () => setHref(localePath(target, stripLocale(window.location.pathname)) + window.location.search);
    update();
    // 搜索框会用 replaceState 更新 ?q=，点击时再取一次最新值
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [target]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
    e.preventDefault();
    window.location.assign(localePath(target, stripLocale(window.location.pathname)) + window.location.search);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      hrefLang={target === "zh" ? "zh-CN" : "en"}
      aria-label={d.switcher.aria}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Languages className="size-4" aria-hidden />
      {d.switcher.label}
    </a>
  );
}
