import type { ReactNode } from "react";

type BadgeVariant = "published" | "draft" | "compliance" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  published: "bg-success-bg text-success",
  draft: "bg-draft-bg text-draft-fg",
  compliance: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
};

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
