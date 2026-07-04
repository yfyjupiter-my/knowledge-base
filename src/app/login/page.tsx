import { Topbar } from "@/components/ui/Topbar";
import { LoginCard } from "@/components/screens/LoginCard";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar right={<div className="text-xs text-text-muted">Internal · IT staff only</div>} />
      <div className="flex flex-1 items-center justify-center p-10">
        <LoginCard />
      </div>
      <footer className="border-t border-border bg-surface px-4.5 py-4.5 text-center text-xs text-text-muted">
        © Internal IT Knowledge Base — not for external distribution
      </footer>
    </div>
  );
}
