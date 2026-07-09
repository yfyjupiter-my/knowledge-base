"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteDocument } from "@/lib/actions";

export function DeleteDocumentButton({ docId, title }: { docId: string; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant="danger" onClick={() => dialogRef.current?.showModal()}>
        Delete
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-dialog-title"
        // Esc fires `cancel`; block it mid-request so the doc can't be left
        // half-deleted with the dialog gone.
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-kb border border-border bg-surface p-0 text-text shadow-kb backdrop:bg-[#141e2d]/50"
      >
        <div className="p-5">
          <h2 id="delete-dialog-title" className="mb-2 text-base font-bold text-text">
            Delete this document?
          </h2>
          <p className="mb-5 text-[13px] leading-relaxed text-text-muted">
            <span className="font-semibold text-text">{title}</span> will be removed from the
            library. Its version history and audit trail are retained.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => startTransition(() => deleteDocument(docId))}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
