"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { createDocument, type CreateDocumentState } from "@/lib/actions";
import { categories } from "@/lib/categories";

const initialState: CreateDocumentState = {};

const categoryMeta: Record<string, { desc: string; icon: React.ReactNode; iconClass: string }> = {
  "Tech Guide": {
    desc: "How-tos, SOPs, runbooks",
    iconClass: "bg-primary/15 text-primary",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2.5h7l3 3V13.5H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M9.5 2.5v3.5h3.5M5 8.5h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  "Sys Config": {
    desc: "Settings, infrastructure",
    iconClass: "bg-accent/15 text-accent",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  Compliance: {
    desc: "Policies, audited docs",
    iconClass: "bg-warning-bg text-warning",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1.5l5 2v4c0 3-2.2 5.2-5 6.5C5.2 12.7 3 10.5 3 7.5v-4z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M5.8 8l1.6 1.6 3-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

export function NewDocumentForm() {
  const [state, formAction, pending] = useActionState(createDocument, initialState);
  const [category, setCategory] = useState<string>(categories[0].docCategory);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  function addTag(raw: string) {
    const value = raw.trim().toLowerCase().replace(/,$/, "").trim();
    if (!value) return;
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setTagInput("");
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <form action={formAction} className="max-w-[680px]">
      {/* Hidden fields the server action reads */}
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="tags" value={tags.join(",")} />

      <p className="mb-7 text-sm text-text-muted">
        Three quick steps. Your document is saved as a private draft the moment you create it.
      </p>

      <Step num={1} title="Name it">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-muted">
            Title <span className="text-danger">*</span>
          </span>
          <input
            name="title"
            required
            placeholder="e.g. Password Reset SOP"
            className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-[17px] font-semibold text-text outline-none placeholder:font-normal placeholder:text-text-muted focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-muted">Subtitle</span>
          <input
            name="subtitle"
            placeholder="One-line summary"
            className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
          />
        </label>
      </Step>

      <Step num={2} title="Classify it">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {categories.map((c) => {
            const meta = categoryMeta[c.docCategory];
            const selected = category === c.docCategory;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(c.docCategory)}
                className={`relative flex flex-col gap-1.5 rounded-kb border bg-surface p-3.5 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/[0.06] shadow-[inset_0_0_0_1px_var(--color-primary)]"
                    : "border-border hover:border-primary"
                }`}
              >
                <span className={`grid h-[30px] w-[30px] place-items-center rounded-kb ${meta.iconClass}`}>
                  {meta.icon}
                </span>
                <span className="text-[13.5px] font-bold text-text">{c.sidebarLabel}</span>
                <span className="text-[11.5px] leading-snug text-text-muted">{meta.desc}</span>
                {selected && (
                  <span className="absolute right-3 top-3 text-primary">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="currentColor" />
                      <path d="M4.5 8.2l2.2 2.2 4.8-4.8" stroke="var(--color-primary-fg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Step>

      <Step num={3} title="Tag it">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5 rounded-kb border border-border bg-surface p-2 focus-within:border-primary">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-[12.5px] font-semibold text-text"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="text-text-muted hover:text-danger"
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => addTag(tagInput)}
              placeholder={tags.length ? "Add a tag…" : "e.g. vpn, network"}
              className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm text-text outline-none placeholder:text-text-muted"
            />
          </div>
          <span className="text-xs text-text-muted">Press Enter to add. Tags power search and filtering.</span>
        </div>
      </Step>

      {category === "Compliance" && (
        <div className="mb-6 flex items-start gap-2.5 rounded-kb border border-warning/35 bg-warning-bg px-3.5 py-3 text-[12.5px] text-text">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
            <circle cx="8" cy="8" r="7" stroke="var(--color-warning)" strokeWidth="1.5" />
            <path d="M8 4.5v4.5M8 11.2h.01" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>
            <b className="text-warning">Compliance docs</b> require Approver sign-off before they can be published.
          </span>
        </div>
      )}

      {state.error && (
        <div className="mb-4 rounded-kb border border-danger bg-surface px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create draft"}
        </Button>
        <span className="flex-1" />
        <span className="text-xs text-text-muted">Saves as a private draft</span>
      </div>
    </form>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-primary text-xs font-bold text-primary-fg">
          {num}
        </span>
        <span className="text-[13px] font-bold uppercase tracking-wide text-text">{title}</span>
      </div>
      <div className="flex flex-col gap-3.5 pl-8">{children}</div>
    </section>
  );
}
