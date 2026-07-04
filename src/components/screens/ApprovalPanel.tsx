import { Button } from "@/components/ui/Button";
import { approveDocument } from "@/lib/actions";

export function ApprovalPanel({ docId, canApprove }: { docId: string; canApprove: boolean }) {
  const approve = approveDocument.bind(null, docId);

  return (
    <div className="mb-5 rounded-kb border border-warning bg-warning-bg p-4">
      <div className="mb-1.5 text-[13px] font-bold text-text">Approver sign-off required</div>
      <div className="mb-3 text-xs leading-relaxed text-text-muted">
        Compliance docs need an Approver before Draft → Published.
      </div>
      {canApprove ? (
        <form action={approve}>
          <Button type="submit" variant="warning" className="!px-3.5 !py-2 text-xs">
            Approve &amp; Publish
          </Button>
        </form>
      ) : (
        <div className="text-xs italic text-text-muted">
          You don’t have the Approver role for this document.
        </div>
      )}
    </div>
  );
}
