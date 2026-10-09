import Link from "next/link";
import { getDictionary } from "@/lib/i18n";

// not-found 无法获取路由参数，因此同时显示英文和中文
export default function NotFound() {
  const zh = getDictionary("zh").notFound;
  const en = getDictionary("en").notFound;
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-sm text-sky-600">404</p>
      <h1 className="mt-2 text-2xl font-bold">{en.title}</h1>
      <p className="mt-1 text-lg font-medium text-slate-500">{zh.title}</p>
      <p className="mt-3 text-sm text-slate-500">
        {en.hint}
        <br />
        {zh.hint}
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
        {en.home} / {zh.home}
      </Link>
    </div>
  );
}
