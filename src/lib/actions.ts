"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { supabase } from "./supabase";
import { getUserRole } from "./data";
import { categories } from "./categories";
import type { DocCategoryLabel } from "./mock-data";

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
      .upsert({ user_email: email, doc_id: docId });
    if (error) throw new Error(`Failed to add favorite: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("kb_favorites")
      .delete()
      .eq("user_email", email)
      .eq("doc_id", docId);
    if (error) throw new Error(`Failed to remove favorite: ${error.message}`);
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

  const { error } = await supabase
    .from("kb_documents")
    .update({ status: "published", last_reviewed: today(), review_overdue: false })
    .eq("id", docId)
    .eq("status", "draft");
  if (error) throw new Error(`Failed to publish document: ${error.message}`);

  const { error: auditError } = await supabase
    .from("kb_audit_log")
    .insert({ doc_id: docId, date: today(), entry: `approved & published by ${name}` });
  if (auditError) throw new Error(`Failed to write audit entry: ${auditError.message}`);

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
    return { error: `Failed to create document: ${error.message}` };
  }

  await supabase.from("kb_doc_versions").insert({
    doc_id: id,
    version: "v1",
    author: name,
    date: today(),
    note: "initial draft",
    current: true,
  });
  await supabase.from("kb_audit_log").insert({
    doc_id: id,
    date: today(),
    entry: `created by ${name}`,
  });

  revalidatePath("/library");
  redirect(`/docs/${id}`);
}
