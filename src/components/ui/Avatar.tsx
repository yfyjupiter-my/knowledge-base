export function Avatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "h-[22px] w-[22px] text-[10px]" : "h-8 w-8 text-xs";
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-accent font-bold text-primary-fg ${dimensions}`}
    >
      {initials}
    </div>
  );
}
