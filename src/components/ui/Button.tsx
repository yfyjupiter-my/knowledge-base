import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "warning";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  ghost: "border border-border bg-transparent text-text hover:bg-surface-alt",
  warning: "bg-warning text-white font-bold hover:opacity-90",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-kb px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
