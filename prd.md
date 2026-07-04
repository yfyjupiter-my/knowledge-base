# PRD: Internal IT Knowledge Base

## 1. Executive Summary

**Problem Statement**: IT documentation (technical guides, system configuration procedures, compliance documents) is scattered across shared drives, chat threads, and personal notes. This causes duplicate/outdated copies to circulate and makes it slow and inconsistent for IT staff — especially across regional offices — to find the current, authoritative version of a procedure.

**Proposed Solution**: A self-hosted, Google-authenticated internal knowledge base restricted to the IT team, providing structured document management (create, version, categorize, search) with a single source of truth accessible to all regional IT colleagues.

**Success Criteria**:
- Reduce average time-to-find-a-document from current ad-hoc baseline to **< 30 seconds** via search/browse.
- Eliminate duplicate/conflicting document copies: **100% of published docs have exactly one canonical, version-tracked entry**.
- **≥ 90%** of active IT staff (across all regions) actively using the KB (≥1 login/week) within 60 days of launch.
- **Zero unauthorized (non-IT) access** — verified via access logs/audit review.
- Document staleness: **100% of compliance documents** display a "last reviewed" date and owner, with automated reminders for docs older than a configurable review interval (default 12 months).

## 2. User Experience & Functionality

### User Personas
- **IT Engineer (Contributor)**: Writes/updates technical guides and configuration procedures for systems they own.
- **IT Team Lead / Compliance Owner (Approver)**: Reviews and approves compliance documents before publishing; manages document lifecycle.
- **Regional IT Staff (Reader)**: Searches and reads documentation to perform day-to-day operational tasks; based in a different office/timezone than the doc author.
- **IT Admin (System Owner)**: Manages users, access, categories, and system configuration of the KB itself.

### User Stories
1. As an **IT Engineer**, I want to create and edit a technical guide in a rich-text/markdown editor so that I can document a procedure without needing to know HTML.
2. As an **IT Engineer**, I want to save drafts and publish when ready, so that half-finished docs aren't visible to everyone.
3. As a **Regional IT Staff** member, I want to search by keyword, category, or tag so that I can find the right document within seconds regardless of which office authored it.
4. As a **Compliance Owner**, I want to see version history and who changed what, so that I can audit changes to compliance-sensitive documents.
5. As an **IT Team Lead**, I want documents to show a "last reviewed" date and owner, so that stale or unowned documents are flagged for review.
6. As any **IT team member**, I want to log in with my company Google account, so that I don't need a separate password and access is centrally controlled.
7. As an **IT Admin**, I want to restrict access to only members of the IT Google Workspace group, so that no one outside IT can view internal system/compliance details.
8. As a **Contributor**, I want to attach files (diagrams, screenshots, config exports) to a document, so that guides are self-contained.
9. As a **Reader**, I want to bookmark/favorite frequently used docs, so that I can access them quickly.

### Acceptance Criteria
- **Auth**: Login is only possible via "Sign in with Google"; no local username/password option exists.
- **Access restriction**: Only accounts belonging to the configured Google Workspace domain **and** an IT-team Google Group (or explicit allowlist) can reach any authenticated page; all others see an "access denied" page post-login, not a generic error.
- **Search**: Full-text search across title, body, and tags returns results in < 1 second for a repository of up to 5,000 documents.
- **Versioning**: Every save creates a new version; prior versions are viewable and diffable; nothing is hard-deleted without admin action.
- **Categorization**: Documents support category (e.g., Technical Guide, System Configuration, Compliance), tags, and owning team/region.
- **Review workflow**: Compliance-category documents require an "Approver" role sign-off before status changes from Draft → Published.
- **Audit trail**: Every create/edit/publish/delete/permission-change action is logged with user, timestamp, and action type.
- **Cross-region consistency**: A single canonical document is visible identically to all regions (no per-region forks) unless explicitly authored as region-specific with clear labeling.

### Non-Goals
- Not a general-purpose company-wide wiki for non-IT departments (v1 is IT-only).
- Not a replacement for ticketing/ITSM systems (no incident or change-request workflows).
- Not building real-time multi-cursor collaborative editing (single-editor-at-a-time is acceptable for v1).
- Not supporting non-Google identity providers (e.g., SAML/AD/local accounts) in v1.
- Not translating documents automatically for regional languages in v1.

## 3. AI System Requirements

Not applicable for v1 — this is a documentation CRUD + search system with no AI-generated content or model-backed features planned. (Revisit in a later phase if AI-assisted search/summarization is desired — flag as a v2+ candidate, not in current scope.)

## 4. Technical Specifications

### Tech Stack
- **Frontend/Backend**: Next.js (App Router) + TypeScript + Tailwind CSS — single deployable app serving both UI and API routes.
- **Database**: PostgreSQL (self-hosted on the same Ubuntu host or a dedicated DB host) — chosen for relational integrity (users, docs, versions, permissions) and full-text search support (`tsvector`).
- **File storage**: Local filesystem volume on the Ubuntu host for attachments (diagrams, exported configs), with path stored in Postgres. Revisit object storage (e.g., MinIO) if volume grows significantly.
- **Auth**: Google OAuth 2.0 / OpenID Connect via NextAuth.js (Auth.js), restricted to the organization's Google Workspace domain and an IT Google Group membership check via Google Admin SDK (or a maintained allowlist if Admin SDK access isn't available).
- **Process management**: Node.js app run under `systemd` (or PM2) for auto-restart on crash/reboot.
- **Reverse proxy / TLS**: Nginx in front of the Next.js app, terminating HTTPS (internal CA or Let's Encrypt if the host is reachable for ACME challenges; otherwise internal cert).

### Architecture Overview
```
[Regional IT Users] --HTTPS--> [Nginx reverse proxy] --> [Next.js app (Node.js)] --> [PostgreSQL]
                                                                 |--> [Local file storage volume]
                        Google OAuth/OIDC <-- auth redirect -----|
```
- Next.js server-renders authenticated pages; API routes handle document CRUD, search, versioning, and admin operations.
- Session state managed via NextAuth (JWT or DB-backed sessions in Postgres).
- Search implemented via PostgreSQL full-text search (`tsvector`/`GIN` index) for v1; revisit Elasticsearch/Meilisearch only if scale/relevance demands it.

### Integration Points
- **Google OAuth 2.0 / OIDC**: Sign-in and identity verification.
- **Google Workspace Admin SDK (optional)**: Group-membership check to confirm "IT team" membership at login time. If Admin SDK access is not grantable, fall back to a manually maintained email allowlist table managed by IT Admins in-app.
- **PostgreSQL**: Primary data store (users, documents, versions, categories, tags, audit log, attachments metadata).
- **SMTP (optional, v1.1)**: For review-reminder and stale-document notification emails.

### Security & Privacy
- All traffic served over HTTPS (Nginx-terminated TLS); no plaintext HTTP access from outside `localhost`.
- Authentication exclusively via Google OAuth — no locally stored passwords.
- Authorization: domain + group allowlist check enforced server-side on every request (middleware), not just at login.
- Role-based access control: Admin, Approver, Contributor, Reader roles scoped per document category.
- Audit log retained for all content and permission changes (who/what/when), stored in Postgres, exportable for compliance review.
- Compliance documents support restricted visibility (e.g., viewable by all IT, but editable only by designated Approvers).
- Regular encrypted backups of the PostgreSQL database and attachment volume (e.g., nightly `pg_dump` + rsync to a separate backup target) — **TBD**: confirm existing backup infrastructure/target on the Ubuntu host.
- OS/dependency patching cadence for Ubuntu 22.04 host — **TBD**: confirm who owns host patching (this team vs. infra team).

## 5. Risks & Roadmap

### Phased Rollout
- **MVP (Phase 1)**: Google-auth login restricted to IT domain/group; create/edit/publish documents with categories and tags; full-text search; version history; basic audit log.
- **v1.1**: Approval workflow for compliance documents; stale-document review reminders (email); favorites/bookmarks; file attachments.
- **v2.0**: Advanced RBAC (per-region editors), analytics on document usage/search gaps, evaluate AI-assisted search/summarization, consider object storage for attachments at scale.

### Technical Risks
- **Google Group membership check complexity**: If Admin SDK / Workspace admin access can't be granted to the app's service account, the fallback allowlist requires manual upkeep and could drift out of date — mitigate with a periodic reconciliation reminder for IT Admins.
- **Single-host deployment (no built-in HA)**: On-prem single Ubuntu host is a single point of failure — mitigate with automated backups and a documented recovery runbook; evaluate HA/failover only if uptime requirements justify the added complexity.
- **Search relevance at scale**: PostgreSQL full-text search may need tuning or replacement (e.g., Meilisearch) if document volume or relevance requirements grow beyond v1 expectations.
- **Certificate management on-prem**: If the host isn't internet-reachable for Let's Encrypt ACME challenges, an internal CA or manually renewed certs will be needed — plan renewal reminders to avoid outages.
- **Scope creep beyond IT-only access**: Other departments may request access once they see the tool; product/access decisions should explicitly defer this to a future phase to protect v1 timeline.
