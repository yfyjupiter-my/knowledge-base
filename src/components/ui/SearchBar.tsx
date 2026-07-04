"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buildHref, type QueryParams } from "@/lib/query";

const DEBOUNCE_MS = 300;

export function SearchBar({
  placeholder,
  className = "",
  params = {},
}: {
  placeholder: string;
  className?: string;
  params?: QueryParams;
}) {
  const router = useRouter();
  const [value, setValue] = useState(params.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const navigate = (q: string) => {
    router.push(buildHref(params, { q: q.trim() || undefined }));
  };

  const onChange = (q: string) => {
    setValue(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(q), DEBOUNCE_MS);
  };

  return (
    <form
      className={`flex items-center gap-2.5 rounded-kb border border-border bg-surface px-3.5 py-2.5 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <Search className="h-4 w-4 text-text-muted" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-none bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
      />
    </form>
  );
}
