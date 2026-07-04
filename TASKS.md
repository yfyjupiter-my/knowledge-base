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

## Suggested order

Phase 0 → 1 → 2 → 3 deliver a fully navigable read-only app with no backend needed.
Phase 4 is a separate track gated on the data-store decision.
