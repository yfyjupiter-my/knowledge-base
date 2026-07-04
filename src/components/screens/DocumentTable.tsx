import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { StarToggle } from "@/components/ui/StarToggle";
import type { Document } from "@/lib/mock-data";

export function DocumentTable({ documents }: { documents: Document[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["Title", "Category", "Owner", "Last reviewed", "Status", ""].map((heading) => (
            <th
              key={heading}
              className="border-b border-border px-4.5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted"
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id} className="border-b border-border last:border-none hover:bg-surface-alt">
            <td className="px-4.5 py-3 text-[13px]">
              <Link href={`/docs/${doc.id}`} className="font-semibold text-text hover:text-primary">
                {doc.title}
              </Link>
              <div className="mt-0.5 text-xs text-text-muted">{doc.subtitle}</div>
            </td>
            <td className="px-4.5 py-3 text-[13px]">
              <Tag>{doc.category}</Tag>
            </td>
            <td className="px-4.5 py-3 text-[13px]">
              <div className="flex items-center gap-2">
                <Avatar initials={doc.owner.initials} size="sm" />
                {doc.owner.name}
              </div>
            </td>
            <td className="px-4.5 py-3 text-[13px]">
              {doc.reviewOverdue ? (
                <Badge variant="danger">{doc.lastReviewed} ⚠</Badge>
              ) : (
                doc.lastReviewed
              )}
            </td>
            <td className="px-4.5 py-3 text-[13px]">
              <Badge variant={doc.status}>{doc.status === "published" ? "Published" : "Draft"}</Badge>
            </td>
            <td className="px-4.5 py-3 text-[13px]">
              <StarToggle docId={doc.id} initialFavorited={doc.favorited} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
