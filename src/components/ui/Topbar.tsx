import type { ReactNode } from "react";

export function Topbar({
  center,
  right,
}: {
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-7 py-3.5">
      <div className="flex items-center gap-2.5 text-[17px] font-bold text-text">
        <div className="flex h-7 w-7 items-center justify-center rounded-kb bg-primary text-[13px] font-extrabold text-primary-fg">
          KB
        </div>
        IT Knowledge Base
      </div>
      {center}
      {right}
    </div>
  );
}
