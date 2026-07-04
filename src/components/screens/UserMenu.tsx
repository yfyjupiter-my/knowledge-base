import { Avatar } from "@/components/ui/Avatar";
import { signOut } from "@/auth";

function initialsFrom(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "?";
}

export function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar initials={initialsFrom(name, email)} />
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="cursor-pointer text-xs font-semibold text-text-muted hover:text-text">
          Sign out
        </button>
      </form>
    </div>
  );
}
