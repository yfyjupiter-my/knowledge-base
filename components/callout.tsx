import type { ReactNode } from "react";
import { CircleAlert, Info, Lightbulb, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { CalloutType } from "@/lib/markdown-plugins";

const STYLES: Record<CalloutType, { label: string; icon: LucideIcon; box: string; title: string }> = {
  note: {
    label: "说明",
    icon: Info,
    box: "border-sky-500 bg-sky-50 dark:bg-sky-400/10",
    title: "text-sky-700 dark:text-sky-300",
  },
  tip: {
    label: "提示",
    icon: Lightbulb,
    box: "border-emerald-500 bg-emerald-50 dark:bg-emerald-400/10",
    title: "text-emerald-700 dark:text-emerald-300",
  },
  important: {
    label: "重要",
    icon: CircleAlert,
    box: "border-violet-500 bg-violet-50 dark:bg-violet-400/10",
    title: "text-violet-700 dark:text-violet-300",
  },
  warning: {
    label: "警告",
    icon: TriangleAlert,
    box: "border-amber-500 bg-amber-50 dark:bg-amber-400/10",
    title: "text-amber-800 dark:text-amber-300",
  },
  caution: {
    label: "危险操作",
    icon: OctagonAlert,
    box: "border-rose-500 bg-rose-50 dark:bg-rose-400/10",
    title: "text-rose-700 dark:text-rose-300",
  },
};

export function Callout({ type, title, children }: { type: string; title?: string; children: ReactNode }) {
  const style = STYLES[type as CalloutType] ?? STYLES.note;
  const Icon = style.icon;
  return (
    <aside role="note" className={`my-6 rounded-r-xl border-l-4 px-4 py-3 ${style.box}`}>
      <p className={`mt-0 mb-1 flex items-center gap-2 text-sm font-semibold ${style.title}`}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {title ?? style.label}
      </p>
      <div className="text-[0.95em] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}
