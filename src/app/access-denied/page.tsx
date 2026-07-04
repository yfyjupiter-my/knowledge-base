import { Topbar } from "@/components/ui/Topbar";
import { signOut } from "@/auth";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar right={<div className="text-xs text-text-muted">Internal · IT staff only</div>} />
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="w-[400px] rounded-kb border border-border bg-surface p-9 text-center shadow-kb">
          <h2 className="mb-1.5 text-[19px] font-bold text-text">Access denied</h2>
          <p className="mb-6 text-[13px] text-text-muted">
            Your Google account isn&apos;t a member of the IT Google Workspace group. Contact IT Admin if you
            believe this is a mistake.
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full cursor-pointer rounded-kb border border-border bg-surface p-3 text-sm font-semibold text-text"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
