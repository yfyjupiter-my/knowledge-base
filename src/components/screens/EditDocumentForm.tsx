"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { updateDocument, type UpdateDocumentState } from "@/lib/actions";
import type { Document } from "@/lib/mock-data";

const initialState: UpdateDocumentState = {};

export function EditDocumentForm({ doc }: { doc: Document }) {
  const boundAction = updateDocument.bind(null, doc.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex max-w-[720px] flex-col gap-4">
      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={doc.title}
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
        />
      </Field>
      <Field label="Subtitle">
        <input
          name="subtitle"
          defaultValue={doc.subtitle}
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
        />
      </Field>
      <Field label="Tags (comma-separated)">
        <input
          name="tags"
          defaultValue={doc.tags.join(", ")}
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
        />
      </Field>
      <Field label="Content (Markdown)">
        <textarea
          name="content"
          rows={16}
          defaultValue={doc.content}
          className="w-full rounded-kb border border-border bg-surface px-3.5 py-2.5 font-mono text-sm text-text outline-none placeholder:text-text-muted focus:border-primary"
        />
      </Field>
      <Field label="What changed?">
        <input
          name="note"
          required
          placeholder="e.g. clarified retention schedule"
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
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
      <p className="text-xs text-text-muted">
        Saving records a new version and an audit log entry. The change note is required.
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
