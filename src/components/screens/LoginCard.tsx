import { signIn } from "@/auth";

export function LoginCard() {
  return (
    <div className="w-[400px] rounded-kb border border-border bg-surface p-9 text-center shadow-kb">
      <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-[14px] bg-primary text-[22px] font-extrabold text-primary-fg">
        KB
      </div>
      <h2 className="mb-1.5 text-[19px] font-bold text-text">IT Knowledge Base</h2>
      <p className="mb-6 text-[13px] text-text-muted">Sign in with your company Google account</p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/library" });
        }}
      >
        <button
          type="submit"
          className="mb-5 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-kb border border-border bg-surface p-3 text-sm font-semibold text-text"
        >
          <span
            className="h-4.5 w-4.5 rounded-sm"
            style={{
              background:
                "conic-gradient(from 45deg, #4285F4 0 25%, #34A853 25% 50%, #FBBC05 50% 75%, #EA4335 75% 100%)",
            }}
          />
          Sign in with Google
        </button>
      </form>
      <hr className="mb-5 border-t border-dashed border-border" />
      <p className="mb-3.5 text-xs leading-relaxed text-text-muted">
        Access is limited to accounts in the <strong className="text-text">IT Google Workspace group</strong>.
        <br />
        No username/password login is available.
      </p>
      <a href="#" className="text-xs font-semibold text-primary">
        Trouble signing in? Contact IT Admin
      </a>
    </div>
  );
}
