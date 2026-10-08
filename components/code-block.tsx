"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";

export function CodeBlock({ language, children }: { language?: string; children: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    const text = preRef.current?.textContent ?? "";
    const ok = await copyText(text.replace(/\n$/, ""));
    setState(ok ? "copied" : "failed");
    window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="not-prose group my-5 overflow-hidden rounded-xl bg-[#0d1117] ring-1 ring-slate-900/10 dark:ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-slate-400">{language ?? "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
          aria-label="复制代码"
        >
          {state === "copied" ? (
            <>
              <Check className="size-3.5 text-emerald-400" aria-hidden /> 已复制
            </>
          ) : state === "failed" ? (
            <>复制失败，请手动选择</>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden /> 复制
            </>
          )}
        </button>
      </div>
      <pre ref={preRef} className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-100 [&_code]:bg-transparent! [&_code]:p-0!">
        {children}
      </pre>
    </div>
  );
}
