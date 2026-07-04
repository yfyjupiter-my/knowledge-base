import type { ReactNode } from "react";

export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block rounded-kb border border-border bg-surface-alt px-2.5 py-1 text-xs text-text-muted ${className}`}
    >
      {children}
    </span>
  );
}
