import { Panel } from "@/components/ui/Panel";
import type { AuditEntry } from "@/lib/mock-data";

export function AuditLogPanel({ entries }: { entries: AuditEntry[] }) {
  return (
    <Panel className="p-4.5">
      <h3 className="mb-3 text-sm font-bold text-text">Audit Log</h3>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="border-b border-dashed border-border py-1.5 text-xs text-text-muted last:border-none"
        >
          {entry.date} — {entry.entry}
        </div>
      ))}
    </Panel>
  );
}
