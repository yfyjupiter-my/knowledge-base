# Design System — Corporate Trust Theme

Reverse-extracted from `theme.html` (`[data-theme="corporate"]`). This is the default theme for the IT Knowledge Base — a clean, navy/blue enterprise SaaS look intended to read as trustworthy and authoritative for compliance-sensitive content.

## Design Principles

- **Authoritative, not playful**: cool navy primary, muted slate text, restrained accent usage — signals "system of record" rather than consumer app.
- **Status legibility first**: badges (Draft/Published/Compliance/Stale) use distinct hue families so document state is scannable at a glance in a dense grid.
- **Low-contrast surfaces, high-contrast state**: neutral backgrounds recede; color is reserved for actionable/status signals (badges, primary buttons, active nav).

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f4f6f9` | Page background |
| `--surface` | `#ffffff` | Cards, topbar, panels, table rows |
| `--surface-alt` | `#eef1f6` | Hover states, sidebar active-nav rest, tag backgrounds |
| `--border` | `#dbe2ea` | All hairline borders (cards, tables, dividers) |
| `--text` | `#1c2b3a` | Primary text |
| `--text-muted` | `#5b6b7d` | Meta text, labels, placeholders |
| `--primary` | `#1f4e8c` | Primary buttons, active nav, brand mark |
| `--primary-hover` | `#163a68` | Primary button hover |
| `--primary-fg` | `#ffffff` | Text/icons on primary-colored surfaces |
| `--accent` | `#0e7c86` | Secondary accent (avatar fill) |
| `--success` / `--success-bg` | `#1c8a4b` / `#e5f5ec` | Published badge |
| `--warning` / `--warning-bg` | `#b8790a` / `#fbf0dd` | Compliance/pending-approval badge |
| `--danger` / `--danger-bg` | `#c23838` / `#fbe8e8` | Stale/error badge |
| `--draft-bg` / `--draft-fg` | `#edf0f4` / `#5b6b7d` | Draft badge (neutral, deliberately unremarkable) |

## Typography

- **Font stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` — system UI font, no custom font loading.
- **Heading font**: same system stack (`--font-heading`), distinguishing this theme from Minimal Clean's serif headings.
- Base body line-height: `1.5`.
- Scale in use: page title `24px` / panel & brand `14–17px` / body `14px` / meta & badges `12–13px` / eyebrow labels `11px` uppercase with `.04–.06em` letter-spacing.

## Shape & Elevation

- `--radius: 8px` — used consistently on buttons, cards, inputs, panels, tags.
- `--shadow: 0 1px 2px rgba(20,30,45,.06), 0 1px 8px rgba(20,30,45,.04)` — a soft double-shadow (tight contact shadow + broad ambient) applied to cards/panels only; flat elements (topbar, sidebar) rely on `--border` instead of shadow.

## Components

- **Topbar**: white surface, bottom border only (no shadow), brand mark is a solid `--primary` square with `--radius` and initials.
- **Sidebar nav**: grouped under uppercase muted section labels; active item gets solid `--primary` fill + `--primary-fg` text; hover gets `--surface-alt`.
- **Search bar**: bordered pill/rect input on `--surface`, icon + input inline, no visible focus ring defined (gap — see below).
- **Buttons**: `btn-primary` (filled `--primary`) and `btn-ghost` (bordered, transparent) — no destructive/tertiary variant defined yet.
- **Badges**: pill-shaped (`999px` radius, distinct from the 8px system radius), color-coded by status, always paired with a version tag (`v4`, `v2`, etc.) in a neutral `--tag` style.
- **Doc cards**: grid layout, hover = border turns `--primary` + `translateY(-1px)` lift, no shadow change on hover.
- **Tables (version history)**: uppercase muted headers, row-hover uses `--surface-alt`, no zebra striping.

## Gaps / Not Yet Specified

- No documented focus-visible / keyboard-navigation styling (accessibility gap — should be added before this leaves playground stage).
- No disabled-state styling for buttons/inputs.
- No dark-mode-within-corporate-theme variant (dark mode is instead a wholly separate theme, "Technical Dark").
- No responsive breakpoints defined — sidebar layout is a fixed `220px` column with no collapse behavior for mobile/narrow viewports.
- No motion/transition tokens beyond ad-hoc `.15s`/`.25s` durations scattered across rules.

## Source

Extracted from: `theme.html`, `[data-theme="corporate"]` CSS custom properties and the `.doc-card`, `.badge-*`, `.nav-item`, `.search-bar`, `.panel` component rules (default/active theme in the playground).
