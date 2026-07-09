import { Topbar } from "@/components/ui/Topbar";
import { AppFooter } from "@/components/screens/AppFooter";
import { UserMenu } from "@/components/screens/UserMenu";
import { NewDocumentForm } from "@/components/screens/NewDocumentForm";
import { BackButton } from "@/components/ui/BackButton";
import { auth } from "@/auth";

export default async function NewDocumentPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar right={<UserMenu name={session?.user?.name} email={session?.user?.email} />} />
      <div className="flex-1 p-7">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="mb-2.5 text-xs text-text-muted">Documents / New</div>
        <h1 className="mb-5 text-[24px] font-bold text-text">New Document</h1>
        <NewDocumentForm />
      </div>
      <AppFooter />
    </div>
  );
}
