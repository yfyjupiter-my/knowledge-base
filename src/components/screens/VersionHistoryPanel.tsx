import { Panel } from "@/components/ui/Panel";
import type { DocVersion } from "@/lib/mock-data";

export function VersionHistoryPanel({ versions }: { versions: DocVersion[] }) {
  return (
    <Panel className="mb-5 p-4.5">
      <h3 className="mb-3 text-sm font-bold text-text">Version History</h3>
      {versions.map((v) => (
        <div
          key={v.version}
          className={`mb-2 rounded-kb p-2.5 text-xs ${v.current ? "bg-surface-alt" : ""}`}
        >
          <div className="mb-0.5 font-bold text-text">
            {v.version} {v.current && "(current)"} — {v.author}
          </div>
          <div className="flex justify-between text-text-muted">
            <span>
              {v.date} · {v.note}
            </span>
            {!v.current && <span className="font-semibold text-primary">Diff</span>}
          </div>
        </div>
      ))}
    </Panel>
  );
}
