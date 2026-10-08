import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localePath, stripLocale } from "./lib/i18n";

/**
 * 路由约定：
 *   /articles/vpn      → 中文（内部重写到 /zh/articles/vpn）
 *   /en/articles/vpn   → 英文
 *   /zh/...            → 重定向到无前缀的规范地址
 * 用户通过切换按钮选择英文后（cookie），访问无前缀地址会自动跳转到英文版。
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (first === DEFAULT_LOCALE) {
    return NextResponse.redirect(new URL(stripLocale(pathname) + search, request.url));
  }
  if (isLocale(first)) return NextResponse.next();

  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(preferred) && preferred !== DEFAULT_LOCALE) {
    return NextResponse.redirect(new URL(localePath(preferred, pathname) + search, request.url));
  }
  return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}${search}`, request.url));
}

export const config = {
  // 跳过 Next 内部资源与带扩展名的静态文件（icon.svg、robots.txt 等）
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
