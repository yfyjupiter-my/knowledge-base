import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-kb border border-border bg-surface shadow-kb ${className}`}
    >
      {children}
    </div>
  );
}
