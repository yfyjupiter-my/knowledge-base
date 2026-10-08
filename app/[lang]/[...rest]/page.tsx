import { notFound } from "next/navigation";

// 未匹配的路径交给 [lang]/not-found.tsx，使 404 页面也带有站点布局
export default function CatchAll() {
  notFound();
}
