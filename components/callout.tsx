import type { ReactNode } from "react";
import { CircleAlert, Info, Lightbulb, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { CalloutType } from "@/lib/markdown-plugins";
import { getDictionary, type Locale } from "@/lib/i18n";

const STYLES: Record<CalloutType, { icon: LucideIcon; box: string; title: string }> = {
  note: {
    icon: Info,
    box: "border-sky-500 bg-sky-50 dark:bg-sky-400/10",
    title: "text-sky-700 dark:text-sky-300",
  },
  tip: {
    icon: Lightbulb,
    box: "border-emerald-500 bg-emerald-50 dark:bg-emerald-400/10",
    title: "text-emerald-700 dark:text-emerald-300",
  },
  important: {
    icon: CircleAlert,
    box: "border-violet-500 bg-violet-50 dark:bg-violet-400/10",
    title: "text-violet-700 dark:text-violet-300",
  },
  warning: {
    icon: TriangleAlert,
    box: "border-amber-500 bg-amber-50 dark:bg-amber-400/10",
    title: "text-amber-800 dark:text-amber-300",
  },
  caution: {
    icon: OctagonAlert,
    box: "border-rose-500 bg-rose-50 dark:bg-rose-400/10",
    title: "text-rose-700 dark:text-rose-300",
  },
};

export function Callout(props: { type: string; title?: string; lang: Locale; children: ReactNode }) {
  const type: CalloutType = props.type in STYLES ? (props.type as CalloutType) : "note";
  const style = STYLES[type];
  const { title, children } = props;
  const Icon = style.icon;
  return (
    <aside role="note" className={`my-6 rounded-r-xl border-l-4 px-4 py-3 ${style.box}`}>
      <p className={`mt-0 mb-1 flex items-center gap-2 text-sm font-semibold ${style.title}`}>
        <Icon className="size-4 shrink-0" aria-hidden />
        {title ?? getDictionary(props.lang).callout[type]}
      </p>
      <div className="text-[0.95em] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </aside>
  );
}
