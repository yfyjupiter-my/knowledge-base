import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// PRD: access restricted to the org's Google Workspace domain (and, longer
// term, an IT Google Group membership check via Admin SDK — see prd.md
// "Technical Risks"). Until that integration exists, domain + allowlist is
// the enforced check.
const allowedDomain = process.env.AUTH_ALLOWED_GOOGLE_DOMAIN;
const allowedEmails = new Set(
  (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      if (!email) return "/access-denied";

      if (allowedEmails.has(email)) return true;

      if (allowedDomain) {
        const domain = email.split("@")[1];
        if (domain === allowedDomain) return true;
      }

      return "/access-denied";
    },
  },
});
