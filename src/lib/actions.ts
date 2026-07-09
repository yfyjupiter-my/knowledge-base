"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { supabase } from "./supabase";
import { logDbError } from "./errors";
import { getUserRole } from "./data";
import { categories } from "./categories";
import type { DocCategoryLabel, DocStatus } from "./mock-data";

async function requireUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Not authenticated");
  return { email, name: session?.user?.name ?? email };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function setFavorite(docId: string, favorited: boolean): Promise<void> {
  const { email } = await requireUser();
  if (favorited) {
    const { error } = await supabase
      .from("kb_favorites")
      .upsert({ user_email: email, doc_id: docId }, { onConflict: "user_email,doc_id" });
    if (error) {
      logDbError("add favorite", error);
      throw new Error("Failed to update favorite.");
    }
  } else {
    const { error } = await supabase
      .from("kb_favorites")
      .delete()
      .eq("user_email", email)
      .eq("doc_id", docId);
    if (error) {
      logDbError("remove favorite", error);
      throw new Error("Failed to update favorite.");
    }
  }
  revalidatePath("/library");
  revalidatePath(`/docs/${docId}`);
}

export async function approveDocument(docId: string): Promise<void> {
  const { email, name } = await requireUser();
  const role = await getUserRole(email);
  if (role !== "approver") {
    throw new Error("Only approvers can approve and publish documents");
  }

  const { data, error } = await supabase
    .from("kb_documents")
    .update({ status: "published", last_reviewed: today(), review_overdue: false })
    .eq("id", docId)
    .eq("status", "draft")
    .select("id");
  if (error) {
    logDbError("publish document", error);
    throw new Error("Failed to publish document.");
  }
  if (!data || data.length === 0) {
    // Already published (or missing) — nothing changed, so don't record a new approval.
    return;
  }

  const { error: auditError } = await supabase
    .from("kb_audit_log")
    .insert({ doc_id: docId, date: today(), entry: `approved & published by ${name}` });
  if (auditError) {
    logDbError("write audit entry (approve)", auditError);
    throw new Error("Failed to record the approval.");
  }

  revalidatePath("/library");
  revalidatePath(`/docs/${docId}`);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export interface CreateDocumentState {
  error?: string;
}

export async function createDocument(
  _prev: CreateDocumentState,
  formData: FormData,
): Promise<CreateDocumentState> {
  const { email, name } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (!title) return { error: "Title is required." };
  if (!categories.some((c) => c.docCategory === category)) {
    return { error: "Pick a valid category." };
  }
  const id = slugify(title);
  if (!id) return { error: "Title must contain letters or numbers." };

  const initials = name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const { error } = await supabase.from("kb_documents").insert({
    id,
    title,
    subtitle,
    category: category as DocCategoryLabel,
    owner_name: name,
    owner_initials: initials || email[0].toUpperCase(),
    last_reviewed: today(),
    status: "draft",
    tags,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "A document with this title already exists." };
    }
    logDbError("create document", error);
    return { error: "Failed to create document. Please try again." };
  }

  const { error: versionError } = await supabase.from("kb_doc_versions").insert({
    doc_id: id,
    version: "v1",
    author: name,
    date: today(),
    note: "initial draft",
    current: true,
  });
  if (versionError) {
    logDbError("create initial version", versionError);
    throw new Error("Failed to create document.");
  }

  const { error: auditError } = await supabase.from("kb_audit_log").insert({
    doc_id: id,
    date: today(),
    entry: `created by ${name}`,
  });
  if (auditError) {
    logDbError("write audit entry (create)", auditError);
    throw new Error("Failed to create document.");
  }

  revalidatePath("/library");
  redirect(`/docs/${id}`);
}

export interface UpdateDocumentState {
  error?: string;
}

export async function updateDocument(
  docId: string,
  _prev: UpdateDocumentState,
  formData: FormData,
): Promise<UpdateDocumentState> {
  const { name } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (!title) return { error: "Title is required." };
  if (!note) return { error: "A short note on what changed is required." };

  // SEC-3: editing a published Compliance doc reverts it to draft so the
  // change goes back through approver sign-off (PRD: compliance edits must not
  // bypass the approval trail). Other categories keep their status.
  const { data: existing, error: fetchError } = await supabase
    .from("kb_documents")
    .select("category, status")
    .eq("id", docId)
    .maybeSingle();
  if (fetchError) {
    logDbError("load document for edit", fetchError);
    return { error: "Failed to save changes. Please try again." };
  }
  if (!existing) return { error: "Document not found." };

  const revertToDraft =
    existing.category === "Compliance" && existing.status === "published";
  const updatePayload: {
    title: string;
    subtitle: string;
    tags: string[];
    content: string;
    status?: DocStatus;
  } = { title, subtitle, tags, content };
  if (revertToDraft) updatePayload.status = "draft";

  const { error } = await supabase
    .from("kb_documents")
    .update(updatePayload)
    .eq("id", docId);
  if (error) {
    logDbError("update document", error);
    return { error: "Failed to save changes. Please try again." };
  }

  const { count } = await supabase
    .from("kb_doc_versions")
    .select("id", { count: "exact", head: true })
    .eq("doc_id", docId);
  const nextVersion = `v${(count ?? 0) + 1}`;

  const { error: unsetError } = await supabase
    .from("kb_doc_versions")
    .update({ current: false })
    .eq("doc_id", docId)
    .eq("current", true);
  if (unsetError) {
    logDbError("unset current version", unsetError);
    throw new Error("Failed to save changes.");
  }

  const { error: versionError } = await supabase.from("kb_doc_versions").insert({
    doc_id: docId,
    version: nextVersion,
    author: name,
    date: today(),
    note,
    current: true,
  });
  if (versionError) {
    logDbError("record new version", versionError);
    throw new Error("Failed to save changes.");
  }

  const auditEntry = revertToDraft
    ? `edited by ${name} — reverted to draft for re-approval`
    : `edited by ${name}`;
  const { error: auditError } = await supabase
    .from("kb_audit_log")
    .insert({ doc_id: docId, date: today(), entry: auditEntry });
  if (auditError) {
    logDbError("write audit entry (edit)", auditError);
    throw new Error("Failed to save changes.");
  }

  revalidatePath("/library");
  revalidatePath(`/docs/${docId}`);
  redirect(`/docs/${docId}`);
}
