export type DocStatus = "published" | "draft";
export type DocCategoryLabel = "Tech Guide" | "Sys Config" | "Compliance";

export interface DocVersion {
  version: string;
  author: string;
  date: string;
  note: string;
  current?: boolean;
}

export interface AuditEntry {
  date: string;
  entry: string;
}

export interface Document {
  id: string;
  title: string;
  subtitle: string;
  category: DocCategoryLabel;
  owner: { name: string; initials: string };
  lastReviewed: string;
  reviewOverdue: boolean;
  status: DocStatus;
  favorited: boolean;
  tags: string[];
  region: string;
  breadcrumb: string[];
  reviewInterval?: string;
  versions?: DocVersion[];
  auditLog?: AuditEntry[];
  attachments?: string[];
}

export const documents: Document[] = [
  {
    id: "vpn-client-setup",
    title: "VPN Client Setup — Windows & macOS",
    subtitle: "Step-by-step VPN configuration for remote access",
    category: "Tech Guide",
    owner: { name: "J. Tan", initials: "JT" },
    lastReviewed: "2026-05-02",
    reviewOverdue: false,
    status: "published",
    favorited: false,
    tags: ["vpn", "network"],
    region: "Global",
    breadcrumb: ["Documents", "Technical Guides", "VPN Client Setup — Windows & macOS"],
  },
  {
    id: "firewall-rule-change-procedure",
    title: "Firewall Rule Change Procedure",
    subtitle: "Approval steps for prod firewall changes",
    category: "Sys Config",
    owner: { name: "M. Reyes", initials: "MR" },
    lastReviewed: "2025-11-14",
    reviewOverdue: false,
    status: "draft",
    favorited: true,
    tags: ["network"],
    region: "Global",
    breadcrumb: ["Documents", "System Configuration", "Firewall Rule Change Procedure"],
  },
  {
    id: "data-retention-policy",
    title: "Data Retention & Deletion Policy",
    subtitle: "Compliance policy — annual review required",
    category: "Compliance",
    owner: { name: "A. Kwan", initials: "AK" },
    lastReviewed: "2024-06-01",
    reviewOverdue: true,
    status: "draft",
    favorited: false,
    tags: ["gdpr", "retention", "backups"],
    region: "Global",
    breadcrumb: ["Documents", "Compliance", "Data Retention & Deletion Policy"],
    reviewInterval: "12 months",
    versions: [
      { version: "v3", author: "A. Kwan", date: "2026-06-30", note: "edited retention table", current: true },
      { version: "v2", author: "A. Kwan", date: "2024-06-01", note: "annual review" },
      { version: "v1", author: "M. Reyes", date: "2023-05-14", note: "initial publish" },
    ],
    auditLog: [
      { date: "2026-06-30", entry: "edited by A. Kwan" },
      { date: "2024-06-01", entry: "reviewed, republished" },
      { date: "2023-05-14", entry: "created by M. Reyes" },
    ],
    attachments: ["config.pdf", "diagram.png"],
  },
  {
    id: "onboarding-checklist",
    title: "Onboarding Checklist — New IT Hires",
    subtitle: "Accounts, hardware, and access provisioning",
    category: "Tech Guide",
    owner: { name: "J. Tan", initials: "JT" },
    lastReviewed: "2026-01-20",
    reviewOverdue: false,
    status: "published",
    favorited: true,
    tags: ["onboarding"],
    region: "Global",
    breadcrumb: ["Documents", "Technical Guides", "Onboarding Checklist — New IT Hires"],
  },
  {
    id: "backup-restore-runbook",
    title: "Backup & Restore Runbook — PostgreSQL",
    subtitle: "Nightly pg_dump + rsync recovery steps",
    category: "Sys Config",
    owner: { name: "M. Reyes", initials: "MR" },
    lastReviewed: "2026-03-11",
    reviewOverdue: false,
    status: "published",
    favorited: false,
    tags: ["backup"],
    region: "Global",
    breadcrumb: ["Documents", "System Configuration", "Backup & Restore Runbook — PostgreSQL"],
  },
];

export const sidebarTags = ["vpn", "network", "backup"];
