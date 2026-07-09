# SEC-AUDIT — Security Vulnerabilities

Audit date: 2026-07-09 · Scope: `src/**` (auth, middleware, server actions, data
layer, Markdown renderer). Excludes `themes.html`, `mockup.html`, `wireframe.html`
per project constraints.

Ordered most-severe first.

---

Item: Stored XSS via Markdown link `href` (`src/components/ui/Markdown.tsx`)
Verdict: ❌ Vulnerable — HIGH
Notes:
- `parseInline` emits `<a href={match[2]}>` with **no scheme validation**. A doc
  author (any authenticated user — editing is open, per Phase 5) can save
  `[click me](javascript:fetch('/x?c='+document.cookie))` as document `content`.
  React does **not** sanitize `href`; `javascript:` URLs still execute on click.
- The file's own docstring claims "no HTML-injection surface" because it avoids
  `dangerouslySetInnerHTML` — but the `javascript:`/`data:` URI vector is
  independent of that and is currently open. Stored + delivered to every reader.
- Required action: allowlist safe schemes before rendering the anchor.

Item: Database effectively open — anon key + permissive RLS, app-only authz (`src/lib/supabase.ts`, all `kb_*` tables)
Verdict: ⚠️ Accepted-for-prototype / ❌ Blocker-for-prod — HIGH
Notes:
- Single shared Supabase client uses a publishable **anon-role** key, and RLS
  "grants the anon role access" (comment in `supabase.ts`). All authorization
  (`requireUser`, `getUserRole`, approver gate) lives in the Next.js layer only.
- Anyone who obtains the project URL + anon key can read/write every document,
  version, favorite, role, and audit-log row **directly**, bypassing the app —
  including tampering with the audit log the PRD relies on for compliance.
- Documented as a known prototype gap (TASKS.md Phase 4), but it is the single
  largest gap between this build and PRD §4 Security. Must close before any
  non-local deployment.
- Required action: move to a secret/service key held server-side + real RLS
  policies keyed on the authenticated identity; never expose write access to anon.

Item: Compliance documents editable by any authenticated user (`src/lib/actions.ts` `updateDocument`)
Verdict: ❌ Vulnerable — MEDIUM
Notes:
- `updateDocument` gates on `requireUser()` only (no role/category check). PRD
  Acceptance Criteria: compliance docs "editable only by designated Approvers,"
  and edits should preserve the approval trail. Today a `viewer` can silently
  rewrite the body of an already-published Compliance doc with no re-approval.
- Phase 5 deliberately opened editing to everyone, but that decision did not
  carve out the Compliance category the PRD singles out. Business-logic +
  integrity concern.
- Required action: block (or require approver role for) edits where
  `category === "Compliance"`, or revert such docs to `draft` on edit.

Item: Google sign-in does not verify `email_verified` (`src/auth.ts` `signIn`)
Verdict: ⚠️ Weak — MEDIUM
Notes:
- The `signIn` callback trusts `profile.email` for both the allowlist and domain
  checks without asserting `profile.email_verified === true`. Google Workspace
  accounts return verified emails, but hardening the check costs nothing and
  prevents any unverified-email edge case from satisfying the domain match.
- Required action: reject sign-in unless `profile.email_verified` is truthy.

Item: Raw Supabase error messages returned to the client (`src/lib/actions.ts`, `src/lib/data.ts`)
Verdict: ⚠️ Weak — MEDIUM
Notes:
- Server actions surface `error.message` verbatim (e.g. `Failed to save changes:
  ${error.message}`) and data-layer functions throw the raw message. These can
  leak column names, constraints, and schema details useful for enumeration.
- Required action: log the detail server-side; return a generic user-facing
  message.

Item: All authenticated users can read every document, including drafts (`src/lib/data.ts`)
Verdict: ⚠️ By-design, note — LOW
Notes:
- No per-document/per-status read scoping; drafts are visible to all IT users.
  Consistent with the PRD's "single canonical doc, IT-only" model, but "save
  drafts so half-finished docs aren't visible to everyone" (User Story 2) is not
  honored — any signed-in user can open another author's draft by slug.
- Predictable slug IDs make draft URLs guessable. Low impact given IT-only
  audience; flag for the RBAC phase (PRD v2.0).

Item: No rate limiting / abuse control on mutating server actions
Verdict: ⚠️ Missing — LOW
Notes:
- `createDocument`, `updateDocument`, `setFavorite` have no throttling; a signed-in
  user could spam rows/versions. Low priority for an internal tool; note for
  hardening.

Item: Middleware auth gate (`src/proxy.ts`)
Verdict: ✅ Correct
Notes:
- Redirects unauthenticated requests to `/login`, allows only `/login` &
  `/access-denied` public, and server actions independently call `requireUser()`
  (defense in depth). Matcher correctly excludes `api/auth` and static assets.
- Confirm the file name matches this Next.js version's middleware convention
  (`proxy.ts` vs `middleware.ts`) — verify the gate actually runs.

Item: Markdown renderer avoids `dangerouslySetInnerHTML`
Verdict: ✅ Correct
Notes:
- Content renders to React elements; the only injection gap is the `href` scheme
  issue tracked above. Bold/italic/code/table paths are safe.

---

## Required actions — remediation backlog

### SEC-1 (HIGH) Sanitize Markdown link schemes — ✅ DONE (2026-07-09)
- [x] Added `safeHref()` in `Markdown.tsx`: default-deny allowlist — only
      `http(s):`, `mailto:`, and relative (`/`, `#`, `?`) URLs pass; everything
      else (incl. `javascript:`, `data:`, `vbscript:`, whitespace-obfuscated
      schemes) returns `null`.
- [x] Disallowed links now render as plain `<span>` text — never a live anchor.
- [x] Added `rel="noopener noreferrer"` on rendered anchors.
- [x] Verified: `[x](javascript:alert(1))` (and `data:`/`vbscript:`/`\tjavascript:`
      variants) produce no anchor; typecheck + eslint clean.

### SEC-2 (HIGH) Close the anon-key / RLS gap before deploy — 🟡 IN PROGRESS (2026-07-09)
Confirmed live state (project `knowledge-board` / `bawjdscthwgnwcnziawo`): all 5
`kb_*` tables have RLS enabled but one policy `"server anon full access"` = ALL
to `anon` with `USING (true)`/`CHECK (true)`. Security advisor flags all 5 as
`rls_policy_always_true` (EXTERNAL). Architecture note: identity is NextAuth
(Google), not Supabase Auth — the Supabase client is trusted server-to-server
code, so the model is **secret (service_role) key + deny anon**, with authz
enforced in the app layer (already the case).

- [x] Docs/code prepped (non-breaking): `.env.example` documents
      `SUPABASE_URL`/`SUPABASE_API_KEY` (secret-key note); `supabase.ts` comment
      now requires the secret key.
- [x] **User action:** rotated `SUPABASE_API_KEY` to the secret key in
      `.env.local` (2026-07-09). Runtime app-load re-verification pending.
- [x] **Applied** migration `sec2_lock_down_kb_rls` — dropped all five
      `"server anon full access"` policies. Confirmed: RLS enabled, 0 policies on
      every `kb_*` table (anon/authenticated now denied; secret key bypasses RLS).
- [x] Re-ran security advisor: the 5 `rls_policy_always_true` WARNs cleared,
      replaced by `rls_enabled_no_policy` INFO — the expected secure state for a
      service-role architecture (default deny + trusted server key).
- [ ] (Follow-up, optional) Add granular per-command policies / append-only
      audit-log constraint if you later want defense beyond the app layer.

Staged migration SQL:
```sql
drop policy if exists "server anon full access" on public.kb_documents;
drop policy if exists "server anon full access" on public.kb_doc_versions;
drop policy if exists "server anon full access" on public.kb_audit_log;
drop policy if exists "server anon full access" on public.kb_favorites;
drop policy if exists "server anon full access" on public.kb_user_roles;
```

### SEC-3 (MEDIUM) Gate Compliance-doc edits — ✅ DONE (2026-07-09)
- Decision: **revert-to-draft** (not approver-only). Editing stays open to all
  authenticated users per Phase 5, but editing a *published* Compliance doc now
  resets it to `draft`, re-showing `ApprovalPanel` so an approver must re-sign.
- [x] `updateDocument` fetches `category`/`status`, sets `status: "draft"` in the
      update payload when `category === "Compliance" && status === "published"`.
- [x] Audit entry records the revert
      (`edited by … — reverted to draft for re-approval`).
- [x] Non-Compliance docs keep their status (unchanged behavior). Typecheck +
      eslint clean.

### SEC-4 (MEDIUM) Require verified Google email — ✅ DONE (2026-07-09)
- [x] `auth.ts` `signIn` now returns `/access-denied` unless
      `profile?.email_verified === true` (strict), checked before both the
      allowlist and domain match. Typecheck + eslint clean.

### SEC-5 (MEDIUM) Stop leaking DB errors — ✅ DONE (2026-07-09)
- [x] Added `src/lib/errors.ts` `logDbError(context, error)` — logs raw detail
      server-side only.
- [x] Every Supabase error path in `actions.ts` and `data.ts` now logs the raw
      error and returns/throws a generic message; no `${error.message}` reaches
      the client (verified by grep). Typecheck + eslint clean.

### SEC-6 (LOW) Draft visibility & abuse hardening (defer to RBAC phase)
- [ ] Restrict draft reads to owner/approver once RBAC lands (PRD v2.0).
- [ ] Add basic rate limiting on mutating server actions.
