import { Panel } from "@/components/ui/Panel";
import { AttachmentChip } from "@/components/ui/AttachmentChip";

export function DocumentBody({ attachments = [] }: { attachments?: string[] }) {
  return (
    <Panel className="p-6">
      <h3 className="mb-2.5 text-[15px] font-bold text-text">1. Purpose</h3>
      <FakeLine width="96%" />
      <FakeLine width="90%" />
      <FakeLine width="70%" />

      <h3 className="mb-2.5 mt-5.5 text-[15px] font-bold text-text">2. Scope &amp; Applicability</h3>
      <FakeLine width="94%" />
      <FakeLine width="78%" />

      <h3 className="mb-2.5 mt-5.5 text-[15px] font-bold text-text">3. Retention Schedule</h3>
      <div className="my-1 rounded-kb bg-surface-alt p-7.5 text-center text-xs text-text-muted">
        [ table placeholder ]
      </div>

      <h3 className="mb-2.5 mt-5.5 text-[15px] font-bold text-text">4. Attachments</h3>
      {attachments.map((name) => (
        <AttachmentChip key={name} name={name} />
      ))}
    </Panel>
  );
}

function FakeLine({ width }: { width: string }) {
  return <div className="mb-2 h-2.5 rounded-sm bg-surface-alt" style={{ width }} />;
}
