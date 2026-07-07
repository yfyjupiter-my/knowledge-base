# TASKS — Wiring up interactivity

The app currently renders as a static mockup from `src/lib/mock-data.ts`. Only three
things are interactive today: document-title links, the `StarToggle`, and Sign out.
This document breaks the remaining work into phases.

## Architecture decision

Filtering, search, and pagination are driven through **URL query params**, not
client-side state:

- `library/page.tsx` is a Server Component. It `await`s `searchParams`
  (a Promise in Next.js 16) and derives the filtered + paginated list server-side.
- Interactive controls (search box, filter dropdowns) are small Client Components
  whose only job is to push a new URL via `useRouter()` / `<Link>`.
- Benefits: shareable/bookmarkable state, no hydration of the whole tree, back-button
  works, and the document count stays in sync with the active filters.

Query param contract (all optional):

| Param      | Meaning                          | Example                     |
| ---------- | -------------------------------- | --------------------------- |
| `q`        | free-text search                 | `?q=vpn`                    |
| `category` | sidebar category slug            | `?category=system-config`   |
| `tag`      | sidebar tag                      | `?tag=network`              |
| `status`   | `published` \| `draft`           | `?status=draft`            |
| `favorites`| `1` = favorites only             | `?favorites=1`              |
| `reviewed` | `overdue` filter                 | `?reviewed=overdue`         |
| `page`     | 1-based page number              | `?page=2`                   |

---

## Phase 0 — Data/filtering foundation (prerequisite)

Everything else depends on this. No UI change yet.

- [x] Add a category-label map. Sidebar shows `"Technical Guides"` / `"System Configuration"`
      / `"Compliance"`, but `Document.category` is `"Tech Guide"` / `"Sys Config"` /
      `"Compliance"`. Introduce stable slugs (`technical-guides`, `system-config`,
      `compliance`) and a lookup both sides share.
- [x] Create `src/lib/query.ts`: `filterDocuments(docs, params)` and
      `paginate(docs, page, pageSize)` returning `{ items, currentPage, totalPages, totalCount }`.
- [x] `filterDocuments` applies, in order: `category` → `tag` → `status` →
      `favorites` → `reviewed` → `q` (match title, subtitle, tags).
- [x] Unit-check the filter logic against the 5 seed docs (e.g. `?status=draft` → 2 rows).

## Phase 1 — Sidebar navigation

Make `src/components/ui/Sidebar.tsx` filters clickable. Stays a Server Component;
each entry becomes a `<Link>`.

- [x] Categories → `<Link href="?category=...">`, with active state derived from the
      current param instead of the hardcoded `activeCategory` prop.
- [x] Tags → `<Link href="?tag=...">`, toggle off when already active.
- [x] Favorites section → link to `?favorites=1` (individual favorite links can point
      at the doc once persistence exists — Phase 4).
- [x] Region checkbox: leave read-only for now (only `"Global"` in seed data) — note as
      out of scope.
- [x] `library/page.tsx` passes current `searchParams` down so active states render.

## Phase 2 — Search & filter chips

- [x] Convert `SearchBar.tsx` to a Client Component: controlled input seeded from `?q`,
      debounced `router.push` on change (or submit on Enter). Reset `page` to 1 on new search.
- [x] Convert `FilterChip.tsx` into real dropdowns (Client Component) for Category,
      Status, and Last-reviewed. Each writes its param and clears `page`.
- [x] Show an "active filters" state + a "Clear all" affordance.
- [x] Replace the hardcoded `"1,248 documents · showing published only"` header text with
      the live `totalCount` from Phase 0.

## Phase 3 — Pagination

Rework `src/components/ui/Pagination.tsx` to navigate.

- [x] Prev / Next / numbered pages become `<Link>`s that set `?page=` (preserving all
      other params). Disable Prev on page 1, Next on last page.
- [x] Drive `currentPage` / `totalPages` / `totalCount` from Phase 0 output instead of the
      hardcoded `currentPage={1} totalPages={3} totalCount={1248}`.
- [x] Decide real `pageSize` (currently 5).

## Phase 4 — Action buttons (needs a data store — DECISION REQUIRED)

These can't be done with the static `mock-data.ts` array; they mutate state. Options:
persist to a real DB (e.g. Supabase, already available), or add a lightweight
server-side store for the prototype. **Confirm approach before starting.**

> **Decision (2026-07-05): Supabase.** Tables `kb_documents` / `kb_doc_versions` /
> `kb_audit_log` / `kb_favorites` / `kb_user_roles` live in the existing
> `knowledge-board` project, seeded from `mock-data.ts`. The server talks to
> Supabase with an anon-role key kept in server env (`SUPABASE_URL` /
> `SUPABASE_API_KEY` in `.env.local`); RLS anon policies are the prototype
> access model — swap to a secret key + real policies before production.
> Roles: `kb_user_roles` (viewer default; approver required for Approve & Publish).

- [x] `+ New Document` → route to a create form + server action to persist.
- [x] Document detail actions (`Approve`, etc. in `ApprovalPanel.tsx`) → server actions
      updating status; reflect in audit log.
- [x] Make `StarToggle` favorites **persist** (currently local `useState` only) via a
      server action, so the `?favorites=1` filter is meaningful.
- [x] Auth/role gating: PRD implies approvals are role-restricted — gate these actions.

---

## Phase 5 — Document editing & attachments (needs decisions — DECISIONS REQUIRED)

`docs/[id]/page.tsx` currently renders four dead buttons (`Edit`, `View history`,
`Attach file`, `Request Approval →`) plus a static `<a href="#">` in
`AuditLogPanel` — all left over from the original mockup, wired to nothing.
`DocumentBody.tsx` also renders hardcoded fake placeholder text (`FakeLine`
bars under "Purpose" / "Scope & Applicability" / "Retention Schedule") because
there is no `content` field anywhere in the schema. This phase makes document
content real and editable.

> **Decisions needed before starting** (mirrors the Phase 4 pattern — confirm,
> then check these off as resolved):
> - **Content format**: plain text / Markdown / rich text? (Markdown rendered
>   server-side is the lightest lift and fits the SOP-style content.)
> - **Edit → version/status semantics**: does saving an edit always cut a new
>   `kb_doc_versions` row? Does editing a *published* Compliance doc revert
>   `status` to `draft` (forcing re-approval), or can approvers edit in place?
> - **Who can edit**: viewer read-only is clear: does editor role suffice, or
>   is editor+approver required per `getUserRole`?
> - **Attachments**: real file upload needs a storage backend (Supabase
>   Storage bucket + policies) — is that in scope now, or does "Attach file"
>   stay stubbed until a storage decision is made?
> - **"Request Approval"**: is this a distinct step from the existing
>   `ApprovalPanel` (which already shows to approvers whenever a Compliance
>   doc is in `draft`), e.g. an audit-log breadcrumb ("requested by X") with
>   no notification system yet — or should the button be removed as
>   redundant?
> - **"View history"**: the version history panel already renders
>   unconditionally in the sidebar when `doc.versions` exists — decide
>   whether this button should be removed (redundant) or repurposed (e.g.
>   deep-link/scroll, or a future full-history route).

- [ ] Add `content` column to `kb_documents` (format per decision above);
      backfill existing rows; add to `DocumentRow` / `Document` types in
      `src/lib/data.ts` and `src/lib/mock-data.ts`.
- [ ] Render real `content` in `DocumentBody.tsx`, replacing the `FakeLine`
      placeholders (keep the section headings only if the content model
      preserves them, otherwise render the raw body).
- [ ] `src/app/docs/[id]/edit/page.tsx` (or a modal) — Client Component form
      seeded with the current title/subtitle/tags/content.
- [ ] `updateDocument` server action in `src/lib/actions.ts`: role-gate per
      the decision above, write the new `content`, append a `kb_doc_versions`
      row (author/date/note from a required "what changed" field), append a
      `kb_audit_log` entry (`edited by ${name}`), apply the status-reversion
      rule for published Compliance docs if decided, `revalidatePath` both
      `/library` and `/docs/${id}`.
- [ ] Wire the `Edit` button in `docs/[id]/page.tsx` to the new route/modal,
      gated so viewers don't see it (or see it disabled).
- [ ] Resolve `Attach file`: either wire to real upload (needs the storage
      decision) or remove the button until that's scheduled.
- [ ] Resolve `Request Approval →` and `View history` per the decisions above
      — implement or remove; no dead buttons should remain on this page.
- [ ] Remove or wire the static `View full audit trail →` link in
      `AuditLogPanel.tsx`.

---

## Suggested order

Phase 0 → 1 → 2 → 3 deliver a fully navigable read-only app with no backend needed.
Phase 4 is a separate track gated on the data-store decision.
Phase 5 is a separate track gated on the content/edit-semantics decisions above.
