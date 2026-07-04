"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { createDocument, type CreateDocumentState } from "@/lib/actions";
import { categories } from "@/lib/categories";

const initialState: CreateDocumentState = {};

export function NewDocumentForm() {
  const [state, formAction, pending] = useActionState(createDocument, initialState);

  return (
    <form action={formAction} className="flex max-w-[560px] flex-col gap-4">
      <Field label="Title">
        <input
          name="title"
          required
          placeholder="e.g. Password Reset SOP"
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
        />
      </Field>
      <Field label="Subtitle">
        <input
          name="subtitle"
          placeholder="One-line summary"
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
        />
      </Field>
      <Field label="Category">
        <select
          name="category"
          required
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.docCategory}>
              {c.sidebarLabel}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tags (comma-separated)">
        <input
          name="tags"
          placeholder="e.g. vpn, network"
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
        />
      </Field>
      {state.error && (
        <div className="rounded-kb border border-danger bg-surface px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="flex gap-2.5">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create draft"}
        </Button>
      </div>
      <p className="text-xs text-text-muted">
        New documents start as drafts. Compliance docs need Approver sign-off before publishing.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
