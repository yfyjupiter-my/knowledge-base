import { notFound } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { Button } from "@/components/ui/Button";
import { DocumentDetailHeader } from "@/components/screens/DocumentDetailHeader";
import { DocumentBody } from "@/components/screens/DocumentBody";
import { ApprovalPanel } from "@/components/screens/ApprovalPanel";
import { VersionHistoryPanel } from "@/components/screens/VersionHistoryPanel";
import { AuditLogPanel } from "@/components/screens/AuditLogPanel";
import { AppFooter } from "@/components/screens/AppFooter";
import { UserMenu } from "@/components/screens/UserMenu";
import { getDocument, getUserRole } from "@/lib/data";
import { auth } from "@/auth";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email ?? undefined;
  const [doc, role] = await Promise.all([getDocument(id, email), getUserRole(email)]);

  if (!doc) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar right={<UserMenu name={session?.user?.name} email={session?.user?.email} />} />
      <div className="grid flex-1 grid-cols-[1fr_376px] gap-6 p-7">
        <div>
          <DocumentDetailHeader doc={doc} />
          <div className="mb-5 flex gap-2.5">
            <Button variant="ghost">Edit</Button>
            <Button variant="ghost">View history</Button>
            <Button variant="ghost">Attach file</Button>
            <span className="flex-1" />
            <Button variant="ghost">Request Approval →</Button>
          </div>
          <DocumentBody attachments={doc.attachments} />
        </div>
        <div>
          {doc.category === "Compliance" && doc.status === "draft" && (
            <ApprovalPanel docId={doc.id} canApprove={role === "approver"} />
          )}
          {doc.versions && <VersionHistoryPanel versions={doc.versions} />}
          {doc.auditLog && <AuditLogPanel entries={doc.auditLog} />}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
