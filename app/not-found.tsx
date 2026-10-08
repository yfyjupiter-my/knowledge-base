import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-sm text-sky-600">404</p>
      <h1 className="mt-2 text-2xl font-bold">文章不存在或已被移除</h1>
      <p className="mt-2 text-sm text-slate-500">链接可能已失效，试试在首页重新搜索。</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
        返回首页
      </Link>
    </div>
  );
}
