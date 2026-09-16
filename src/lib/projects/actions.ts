"use server";

import { getDemoSession } from "@/lib/auth/demo-session";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { projectSlug } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { fetchProjectBySlug } from "./queries";
import type { CreateProjectResult, UploadPhotoResult } from "./types";
import { imageExtension } from "./upload-utils";

async function requireAdmin(): Promise<SupabaseClient> {
  const demo = await getDemoSession();
  if (demo?.role === "admin") {
    return createServiceRoleClient();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    throw new Error("You do not have permission to perform this action.");
  }

  return supabase;
}

function normalizeProjectName(name: string): string {
  return name.trim().toUpperCase();
}

export async function createProject(name: string): Promise<CreateProjectResult> {
  const supabase = await requireAdmin();
  const trimmed = name.trim();
  const normalized = normalizeProjectName(trimmed);

  const { count } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("source_sheet", "MANUAL");

  const nextRow = (count ?? 0) + 1;
  const sourceKey = `MANUAL::${nextRow}`;

  const { data, error } = await supabase
    .from("articles")
    .insert({
      project_raw: trimmed,
      project_normalized: normalized,
      source_sheet: "MANUAL",
      source_row: nextRow,
      source_key: sourceKey,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("A project with this name already exists.");
    }
    throw new Error("Unable to create project. Please try again.");
  }

  revalidatePath("/projects");

  return {
    slug: projectSlug(trimmed),
    articleId: data.id,
    name: trimmed,
  };
}

export async function updateProject(slug: string, newName: string) {
  const supabase = await requireAdmin();
  const project = await fetchProjectBySlug(supabase, slug);
  if (!project) throw new Error("Project not found.");

  const trimmed = newName.trim();
  const normalized = normalizeProjectName(trimmed);

  const { error } = await supabase
    .from("articles")
    .update({
      project_raw: trimmed,
      project_normalized: normalized,
    })
    .in("id", project.articleIds);

  if (error) throw new Error("Unable to update project. Please try again.");

  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${projectSlug(trimmed)}`);
}

async function insertProjectPhoto(
  supabase: SupabaseClient,
  articleId: string,
  file: File,
  imageOrder: number
): Promise<void> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not a supported image.`);
  }

  const ext = imageExtension(file.type);
  const storagePath = `products/${articleId}/${String(imageOrder).padStart(2, "0")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload ${file.name}. Please try again.`);
  }

  const { count: primaryCount } = await supabase
    .from("article_images")
    .select("id", { count: "exact", head: true })
    .eq("article_id", articleId)
    .eq("is_primary", true);

  const { error: insertError } = await supabase.from("article_images").insert({
    article_id: articleId,
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type,
    file_size: file.size,
    image_order: imageOrder,
    is_primary: (primaryCount ?? 0) === 0,
    verification_status: "VERIFIED",
    manifest_confidence: "HIGH",
  });

  if (insertError) {
    throw new Error(`Uploaded ${file.name} but failed to save record. Contact support.`);
  }
}

export async function uploadSingleProjectPhoto(
  articleId: string,
  slug: string,
  formData: FormData,
  imageOrder?: number
): Promise<UploadPhotoResult> {
  const supabase = await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, filename: "unknown", error: "No file provided." };
  }

  try {
    let order = imageOrder;
    if (order == null) {
      const { count } = await supabase
        .from("article_images")
        .select("id", { count: "exact", head: true })
        .eq("article_id", articleId);
      order = (count ?? 0) + 1;
    }

    await insertProjectPhoto(supabase, articleId, file, order);
    revalidatePath("/projects");
    revalidatePath(`/projects/${slug}`);
    return { ok: true, filename: file.name, imageOrder: order };
  } catch (err) {
    return {
      ok: false,
      filename: file.name,
      error: err instanceof Error ? err.message : "Upload failed. Please try again.",
    };
  }
}

export async function uploadProjectPhotos(slug: string, formData: FormData) {
  const supabase = await requireAdmin();
  const project = await fetchProjectBySlug(supabase, slug);
  if (!project) throw new Error("Project not found.");

  let articleId = project.articleIds[0];
  if (!articleId) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("source_sheet", "MANUAL");
    const nextRow = (count ?? 0) + 1;
    const { data, error } = await supabase
      .from("articles")
      .insert({
        project_raw: project.name,
        project_normalized: normalizeProjectName(project.name),
        source_sheet: "MANUAL",
        source_row: nextRow,
        source_key: `MANUAL::${nextRow}`,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("Unable to prepare project for upload.");
    articleId = data.id;
  }

  const files = formData.getAll("files") as File[];
  if (!files.length) throw new Error("No files selected.");

  const { count: existingCount } = await supabase
    .from("article_images")
    .select("id", { count: "exact", head: true })
    .eq("article_id", articleId);

  let order = (existingCount ?? 0) + 1;

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    await insertProjectPhoto(supabase, articleId, file, order);
    order += 1;
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
}
