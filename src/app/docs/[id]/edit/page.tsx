import { notFound } from "next/navigation";
import { Topbar } from "@/components/ui/Topbar";
import { AppFooter } from "@/components/screens/AppFooter";
import { UserMenu } from "@/components/screens/UserMenu";
import { EditDocumentForm } from "@/components/screens/EditDocumentForm";
import { getDocument } from "@/lib/data";
import { auth } from "@/auth";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email ?? undefined;
  const doc = await getDocument(id, email);

  if (!doc) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar right={<UserMenu name={session?.user?.name} email={session?.user?.email} />} />
      <div className="flex-1 p-7">
        <div className="mb-2.5 text-xs text-text-muted">{doc.breadcrumb.join(" / ")} / Edit</div>
        <h1 className="mb-5 text-[24px] font-bold text-text">Edit Document</h1>
        <EditDocumentForm doc={doc} />
      </div>
      <AppFooter />
    </div>
  );
}
