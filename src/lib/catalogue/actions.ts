"use server";

import { appendActivityLogBestEffort } from "@/lib/catalogue/activity-log-server";
import { createArticleOnServer } from "@/lib/catalogue/create-article-server";
import { revalidateAfterCatalogueMutation } from "@/lib/catalogue/revalidate-catalogue";
import {
  type PhotoSlotCandidate,
  preparePhotoSlots,
} from "@/lib/catalogue/photo-upload-slots";
import { getCategorySourceSheet, type CategorySlug, type SeasonSlug } from "@/lib/collections/config";
import { AuthError, getCatalogueMutationClient, requireAdmin } from "@/lib/auth/guards";
import { getDemoSession } from "@/lib/auth/demo-session";

export type CreateCatalogueProductInput = {
  projectName: string;
  articleReference?: string;
  season: SeasonSlug;
  category: CategorySlug;
  making?: string;
  type?: string;
  material?: string;
  colour?: string;
  sizeRange?: string;
  qty?: string;
  remarks?: string;
};

export type CreateCatalogueProductResult =
  | { ok: true; articleId: string }
  | { ok: false; message: string };

export async function createCatalogueProduct(
  input: CreateCatalogueProductInput
): Promise<CreateCatalogueProductResult> {
  try {
    const { supabase, user } = await getCatalogueMutationClient();
    const projectName = input.projectName.trim();
    if (!projectName) {
      return { ok: false, message: "Project name is required." };
    }

    const demo = await getDemoSession();
    if (demo) {
      return {
        ok: false,
        message: "Create product requires Supabase Auth. Sign in with a live employee account.",
      };
    }

    const result = await createArticleOnServer(supabase, user, input);
    if (!result.ok) {
      return result;
    }

    revalidateAfterCatalogueMutation({
      articleId: result.articleId,
      season: input.season,
      category: input.category,
    });

    return { ok: true, articleId: result.articleId };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: err.message };
    }
    console.error("[createCatalogueProduct] unexpected", err);
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to create product.",
    };
  }
}

async function loadArticleImageOrderMeta(
  supabase: Awaited<ReturnType<typeof getCatalogueMutationClient>>["supabase"],
  articleId: string
): Promise<{ maxOrder: number; hasPrimary: boolean }> {
  const { data, error } = await supabase
    .from("article_images")
    .select("image_order, is_primary")
    .eq("article_id", articleId)
    .order("image_order", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    return { maxOrder: 0, hasPrimary: false };
  }

  const maxOrder = Math.max(...data.map((r) => r.image_order as number));
  const hasPrimary = data.some((r) => r.is_primary);
  return { maxOrder, hasPrimary };
}

/** JSON-only: reserve storage paths + orders before browser → Storage upload. */
export async function allocateCataloguePhotoUploadSlots(
  articleId: string,
  candidates: PhotoSlotCandidate[]
): Promise<
  | {
      ok: true;
      slots: Array<{
        clientId: string;
        storagePath: string;
        imageOrder: number;
        isPrimary: boolean;
        originalFilename: string;
        mimeType: string;
        fileSize: number;
      }>;
    }
  | { ok: false; message: string }
> {
  try {
    const { supabase } = await getCatalogueMutationClient();
    const demo = await getDemoSession();
    if (demo) {
      return { ok: false, message: "Photo upload requires Supabase Auth." };
    }
    if (candidates.length === 0) {
      return { ok: false, message: "No photos to upload." };
    }

    const { maxOrder, hasPrimary } = await loadArticleImageOrderMeta(supabase, articleId);
    const slots = preparePhotoSlots(candidates, articleId, maxOrder, hasPrimary);

    if (slots.length === 0) {
      return {
        ok: false,
        message: "No valid images (JPEG, PNG, WebP, GIF — max 12 MB each).",
      };
    }

    if (slots.length < candidates.length) {
      return {
        ok: false,
        message: "Some files were invalid. Check format and size (max 12 MB each).",
      };
    }

    return { ok: true, slots };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: err.message };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to prepare upload.",
    };
  }
}

export type RegisterCataloguePhotoPayload = {
  clientId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  imageOrder: number;
  isPrimary: boolean;
};

/** JSON-only: batch insert metadata after successful Storage uploads. */
export async function registerCataloguePhotoUploads(
  articleId: string,
  uploads: RegisterCataloguePhotoPayload[]
): Promise<
  | { ok: true; imageIdsByClientId: Record<string, string> }
  | { ok: false; message: string }
> {
  try {
    const { supabase } = await getCatalogueMutationClient();
    const demo = await getDemoSession();
    if (demo) {
      return { ok: false, message: "Photo upload requires Supabase Auth." };
    }
    if (uploads.length === 0) {
      return { ok: true, imageIdsByClientId: {} };
    }

    const insertRows = uploads.map((u) => ({
      article_id: articleId,
      storage_path: u.storagePath,
      original_filename: u.originalFilename,
      mime_type: u.mimeType,
      file_size: u.fileSize,
      image_order: u.imageOrder,
      is_primary: u.isPrimary,
      verification_status: "VERIFIED" as const,
      manifest_confidence: "HIGH" as const,
    }));

    const tryInsert = async (client: typeof supabase) =>
      client.from("article_images").insert(insertRows).select("id, storage_path");

    let { data, error } = await tryInsert(supabase);

    if (error?.code === "42501") {
      try {
        const { createServiceRoleClient } = await import("@/lib/supabase/admin");
        const service = createServiceRoleClient();
        ({ data, error } = await tryInsert(service));
      } catch (e) {
        console.error("[registerCataloguePhotoUploads] service fallback", e);
      }
    }

    if (error || !data?.length) {
      console.error("[registerCataloguePhotoUploads]", error);
      return { ok: false, message: "Photos uploaded but gallery records could not be saved." };
    }

    const pathToClientId = new Map(uploads.map((u) => [u.storagePath, u.clientId]));
    const imageIdsByClientId: Record<string, string> = {};
    for (const row of data) {
      const clientId = pathToClientId.get(row.storage_path as string);
      if (clientId) {
        imageIdsByClientId[clientId] = row.id as string;
      }
    }

    revalidateAfterCatalogueMutation({ articleId });
    void appendActivityLogBestEffort(supabase, "UPLOAD_PHOTO", "article_image", articleId, {
      article_id: articleId,
      count: uploads.length,
    });

    return { ok: true, imageIdsByClientId };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: err.message };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to save photo records.",
    };
  }
}

export async function setCataloguePrimaryPhoto(
  articleId: string,
  imageId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { supabase } = await getCatalogueMutationClient();
    const demo = await getDemoSession();
    if (demo) {
      return { ok: false, message: "Photo management requires Supabase Auth." };
    }

    const { error: clearError } = await supabase
      .from("article_images")
      .update({ is_primary: false })
      .eq("article_id", articleId);

    if (clearError) {
      console.error("[setCataloguePrimaryPhoto] clear", clearError);
      return { ok: false, message: "Unable to update primary photo." };
    }

    const { error: setError } = await supabase
      .from("article_images")
      .update({ is_primary: true })
      .eq("id", imageId)
      .eq("article_id", articleId);

    if (setError) {
      console.error("[setCataloguePrimaryPhoto] set", setError);
      return { ok: false, message: "Unable to set primary photo." };
    }

    void appendActivityLogBestEffort(supabase, "SET_PRIMARY_PHOTO", "article_image", imageId, {
      article_id: articleId,
    });

    revalidateAfterCatalogueMutation({ articleId });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to set primary photo.",
    };
  }
}

export async function deleteCataloguePhoto(
  articleId: string,
  imageId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await requireAdmin();
    const { supabase } = await getCatalogueMutationClient();
    const demo = await getDemoSession();
    if (demo) {
      return { ok: false, message: "Photo management requires Supabase Auth." };
    }

    const { data: row, error: fetchError } = await supabase
      .from("article_images")
      .select("storage_path")
      .eq("id", imageId)
      .eq("article_id", articleId)
      .maybeSingle();

    if (fetchError || !row?.storage_path) {
      return { ok: false, message: "Photo not found." };
    }

    const { error: deleteRowError } = await supabase
      .from("article_images")
      .delete()
      .eq("id", imageId)
      .eq("article_id", articleId);

    if (deleteRowError) {
      console.error("[deleteCataloguePhoto] row", deleteRowError);
      return { ok: false, message: "Unable to remove photo." };
    }

    const { error: storageError } = await supabase.storage
      .from("product-images")
      .remove([row.storage_path as string]);

    if (storageError) {
      console.error("[deleteCataloguePhoto] storage", storageError);
    }

    void appendActivityLogBestEffort(supabase, "DELETE_PHOTO", "article_image", imageId, {
      article_id: articleId,
    });

    revalidateAfterCatalogueMutation({ articleId });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: err.message };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to remove photo.",
    };
  }
}

export type UpdateCatalogueProductInput = CreateCatalogueProductInput & {
  articleId: string;
};

export async function updateCatalogueProduct(
  input: UpdateCatalogueProductInput
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { supabase } = await getCatalogueMutationClient();
    const demo = await getDemoSession();
    if (demo) {
      return { ok: false, message: "Edit product requires Supabase Auth." };
    }

    const projectName = input.projectName.trim();
    if (!projectName) {
      return { ok: false, message: "Project name is required." };
    }

    const sourceSheet = getCategorySourceSheet(input.season, input.category);

    const { data: before } = await supabase
      .from("articles")
      .select(
        "project_raw, source_no, source_sheet, making_raw, type_raw, material_raw, colour_raw, size_range_raw, qty_raw, remarks_raw"
      )
      .eq("id", input.articleId)
      .maybeSingle();

    const { error } = await supabase
      .from("articles")
      .update({
        project_raw: projectName,
        project_normalized: projectName.toUpperCase(),
        source_no: input.articleReference?.trim() || null,
        source_sheet: sourceSheet,
        making_raw: input.making?.trim() || null,
        type_raw: input.type?.trim() || null,
        material_raw: input.material?.trim() || null,
        colour_raw: input.colour?.trim() || null,
        size_range_raw: input.sizeRange?.trim() || null,
        qty_raw: input.qty?.trim() || null,
        remarks_raw: input.remarks?.trim() || null,
        making_normalized: input.making?.trim() || null,
        type_normalized: input.type?.trim() || null,
        season_raw: input.season.toUpperCase(),
      })
      .eq("id", input.articleId);

    if (error) {
      console.error("[updateCatalogueProduct]", error);
      return { ok: false, message: "Unable to save changes." };
    }

    const changed: Record<string, { from: string | null; to: string | null }> = {};
    const track = (key: string, from: string | null | undefined, to: string | null | undefined) => {
      const a = from?.trim() || null;
      const b = to?.trim() || null;
      if (a !== b) changed[key] = { from: a, to: b };
    };

    if (before) {
      track("project_name", before.project_raw, projectName);
      track("article_reference", before.source_no, input.articleReference ?? null);
      track("making", before.making_raw, input.making ?? null);
      track("type", before.type_raw, input.type ?? null);
      track("material", before.material_raw, input.material ?? null);
      track("colour", before.colour_raw, input.colour ?? null);
      track("size_range", before.size_range_raw, input.sizeRange ?? null);
      track("qty", before.qty_raw, input.qty ?? null);
      track("remarks", before.remarks_raw, input.remarks ?? null);
    }

    if (Object.keys(changed).length > 0) {
      void appendActivityLogBestEffort(supabase, "UPDATE_PRODUCT", "article", input.articleId, {
        project_name: projectName,
        changed_fields: changed,
      });
    }

    revalidateAfterCatalogueMutation({
      articleId: input.articleId,
      season: input.season,
      category: input.category,
    });

    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: err.message };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unable to save changes.",
    };
  }
}

export async function deleteCatalogueProduct(
  articleId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const admin = await requireAdmin();
    const { supabase } = await getCatalogueMutationClient();
    const demo = await getDemoSession();
    if (demo) {
      return { ok: false, message: "Delete requires Supabase Auth." };
    }

    const { deleteArticleOnServer } = await import("@/lib/catalogue/delete-article-server");
    const result = await deleteArticleOnServer(supabase, articleId, admin.id);

    if (!result.ok) {
      return result;
    }

    revalidateAfterCatalogueMutation({
      articleId,
      season: result.season ?? undefined,
      category: result.category ?? undefined,
    });

    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: err.message };
    }
    console.error("[deleteCatalogueProduct]", err);
    return { ok: false, message: err instanceof Error ? err.message : "Delete failed." };
  }
}
