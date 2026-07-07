import { Panel } from "@/components/ui/Panel";
import { AttachmentChip } from "@/components/ui/AttachmentChip";
import { Markdown } from "@/components/ui/Markdown";

export function DocumentBody({
  content,
  attachments = [],
}: {
  content: string;
  attachments?: string[];
}) {
  return (
    <Panel className="p-6">
      <Markdown content={content} />

      {attachments.length > 0 && (
        <>
          <h3 className="mb-2.5 mt-5.5 text-[15px] font-bold text-text">Attachments</h3>
          {attachments.map((name) => (
            <AttachmentChip key={name} name={name} />
          ))}
        </>
      )}
    </Panel>
  );
}
