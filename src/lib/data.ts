import { supabase } from "./supabase";
import { logDbError } from "./errors";
import { categories } from "./categories";
import type {
  AuditEntry,
  DocCategoryLabel,
  DocStatus,
  Document,
  DocVersion,
  StoredDocStatus,
} from "./mock-data";

export type UserRole = "viewer" | "editor" | "approver";

interface DocumentRow {
  id: string;
  title: string;
  subtitle: string;
  category: DocCategoryLabel;
  owner_name: string;
  owner_initials: string;
  last_reviewed: string;
  review_overdue: boolean;
  status: StoredDocStatus;
  tags: string[];
  region: string;
  review_interval: string | null;
  attachments: string[];
  content: string;
}

function toDocument(row: DocumentRow, favoritedIds: Set<string>): Document {
  const sidebarLabel =
    categories.find((c) => c.docCategory === row.category)?.sidebarLabel ?? row.category;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    owner: { name: row.owner_name, initials: row.owner_initials },
    lastReviewed: row.last_reviewed,
    reviewOverdue: row.review_overdue,
    // Safe: both callers exclude archived rows before reaching here.
    status: row.status as DocStatus,
    favorited: favoritedIds.has(row.id),
    tags: row.tags ?? [],
    region: row.region,
    breadcrumb: ["Documents", sidebarLabel, row.title],
    reviewInterval: row.review_interval ?? undefined,
    attachments: row.attachments && row.attachments.length > 0 ? row.attachments : undefined,
    content: row.content ?? "",
  };
}

async function getFavoritedIds(userEmail: string | undefined): Promise<Set<string>> {
  if (!userEmail) return new Set();
  const { data, error } = await supabase
    .from("kb_favorites")
    .select("doc_id")
    .eq("user_email", userEmail);
  if (error) {
    logDbError("load favorites", error);
    throw new Error("Failed to load favorites.");
  }
  return new Set(data.map((row) => row.doc_id));
}

export async function getDocuments(userEmail: string | undefined): Promise<Document[]> {
  const [{ data, error }, favoritedIds] = await Promise.all([
    supabase
      .from("kb_documents")
      .select("*")
      .neq("status", "archived")
      .order("created_at")
      .order("id"),
    getFavoritedIds(userEmail),
  ]);
  if (error) {
    logDbError("load documents", error);
    throw new Error("Failed to load documents.");
  }
  return (data as DocumentRow[]).map((row) => toDocument(row, favoritedIds));
}

export async function getDocument(
  id: string,
  userEmail: string | undefined,
): Promise<Document | null> {
  const [docResult, versionsResult, auditResult, favoritedIds] = await Promise.all([
    supabase.from("kb_documents").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("kb_doc_versions")
      .select("version, author, date, note, current")
      .eq("doc_id", id)
      .order("id", { ascending: true }),
    supabase
      .from("kb_audit_log")
      .select("date, entry")
      .eq("doc_id", id)
      .order("date", { ascending: false })
      .order("id", { ascending: false }),
    getFavoritedIds(userEmail),
  ]);

  if (docResult.error) {
    logDbError("load document", docResult.error);
    throw new Error("Failed to load document.");
  }
  if (!docResult.data) return null;
  // Archived (soft-deleted) docs read as missing; the row and its trail survive.
  if (docResult.data.status === "archived") return null;
  if (versionsResult.error) {
    logDbError("load versions", versionsResult.error);
    throw new Error("Failed to load document.");
  }
  if (auditResult.error) {
    logDbError("load audit log", auditResult.error);
    throw new Error("Failed to load document.");
  }

  const doc = toDocument(docResult.data as DocumentRow, favoritedIds);
  const versions = versionsResult.data as DocVersion[];
  const auditLog = auditResult.data as AuditEntry[];
  return {
    ...doc,
    versions: versions.length > 0 ? versions : undefined,
    auditLog: auditLog.length > 0 ? auditLog : undefined,
  };
}

export async function getUserRole(userEmail: string | undefined): Promise<UserRole> {
  if (!userEmail) return "viewer";
  const { data, error } = await supabase
    .from("kb_user_roles")
    .select("role")
    .eq("user_email", userEmail)
    .maybeSingle();
  if (error) {
    logDbError("load user role", error);
    throw new Error("Failed to load user role.");
  }
  return (data?.role as UserRole) ?? "viewer";
}
