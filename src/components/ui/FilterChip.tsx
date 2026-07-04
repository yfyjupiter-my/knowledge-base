"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { buildHref, type QueryParams } from "@/lib/query";

export interface FilterOption {
  label: string;
  /** Param value; undefined means "clear this filter". */
  value?: string;
}

export function FilterChip({
  label,
  paramKey,
  options,
  params,
}: {
  label: string;
  paramKey: keyof QueryParams;
  options: FilterOption[];
  params: QueryParams;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const activeValue = params[paramKey];
  const activeOption = options.find((o) => o.value !== undefined && o.value === activeValue);

  return (
    <div
      ref={container}
      className="relative"
      onBlur={(e) => {
        if (!container.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`rounded-kb border px-3.5 py-1.5 text-sm ${
          activeOption
            ? "border-primary bg-primary text-primary-fg"
            : "border-border bg-surface text-text"
        }`}
      >
        {activeOption ? `${label}: ${activeOption.label}` : label} ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-kb border border-border bg-surface py-1 shadow-md">
          {options.map((option) => {
            const selected = option.value === activeValue || (!option.value && !activeOption);
            return (
              <Link
                key={option.label}
                href={buildHref(params, { [paramKey]: option.value })}
                onClick={() => setOpen(false)}
                className={`block px-3.5 py-2 text-sm hover:bg-surface-alt ${
                  selected ? "font-semibold text-text" : "text-text-muted"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
