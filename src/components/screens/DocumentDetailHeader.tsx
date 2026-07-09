import { Badge } from "@/components/ui/Badge";
import type { Document } from "@/lib/mock-data";

const categoryBadgeVariant = {
  "Tech Guide": "published",
  "Sys Config": "published",
  Compliance: "compliance",
} as const;

export function DocumentDetailHeader({ doc, actions }: { doc: Document; actions?: React.ReactNode }) {
  return (
    <>
      <div className="mb-2.5 text-xs text-text-muted">{doc.breadcrumb.join(" / ")}</div>
      <div className="mb-2.5 flex items-center justify-between gap-4">
        <h1 className="text-[24px] font-bold text-text">{doc.title}</h1>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>
      <div className="mb-4.5 flex gap-2">
        <Badge variant={categoryBadgeVariant[doc.category]}>{doc.category}</Badge>
        <Badge variant={doc.status}>{doc.status === "published" ? "Published" : "Draft"}</Badge>
      </div>
      <div className="mb-4.5 flex flex-wrap gap-8 border-b border-border pb-4.5">
        <MetaItem label="Owner" value={doc.owner.name} />
        <MetaItem
          label="Last reviewed"
          value={doc.reviewOverdue ? `${doc.lastReviewed} (overdue)` : doc.lastReviewed}
          overdue={doc.reviewOverdue}
        />
        {doc.reviewInterval && <MetaItem label="Review interval" value={doc.reviewInterval} />}
        <MetaItem label="Region" value={doc.region} />
        <MetaItem label="Tags" value={doc.tags.join(", ")} />
      </div>
    </>
  );
}

function MetaItem({ label, value, overdue }: { label: string; value: string; overdue?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`text-[13px] ${overdue ? "font-semibold text-danger" : "text-text"}`}>{value}</div>
    </div>
  );
}
