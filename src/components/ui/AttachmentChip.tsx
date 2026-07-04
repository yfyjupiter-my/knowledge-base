import { Paperclip } from "lucide-react";

export function AttachmentChip({ name }: { name: string }) {
  return (
    <span className="mr-2 inline-flex items-center gap-1.5 rounded-kb border border-border bg-surface-alt px-3 py-1.5 text-xs text-text">
      <Paperclip className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}
