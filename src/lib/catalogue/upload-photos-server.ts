import "server-only";

import type { UserProfile } from "@/lib/projects/types";
import { imageExtension } from "@/lib/projects/upload-utils";
import { runWithConcurrency, UPLOAD_CONCURRENCY } from "@/lib/projects/upload-utils";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type PreparedPhotoUpload = {
  file: File;
  storagePath: string;
  imageOrder: number;
  isPrimary: boolean;
};


function isStorageDenied(error: { message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() ?? "";
  return msg.includes("row-level security") || msg.includes("403") || msg.includes("denied");
}

async function loadExistingImageMeta(
  supabase: SupabaseClient,
  articleId: string
): Promise<{ maxOrder: number; hasPrimary: boolean }> {
  const { data, error } = await supabase
    .from("article_images")
    .select("image_order, is_primary")
    .eq("article_id", articleId)
    .order("image_order", { ascending: false })
    .limit(50);

  if (error || !data?.length) {
    return { maxOrder: 0, hasPrimary: false };
  }

  const maxOrder = Math.max(...data.map((r) => r.image_order as number));
  const hasPrimary = data.some((r) => r.is_primary);
  return { maxOrder, hasPrimary };
}

export function preparePhotoUploads(
  files: File[],
  articleId: string,
  startOrder: number,
  hasPrimary: boolean
): PreparedPhotoUpload[] {
  const prepared: PreparedPhotoUpload[] = [];
  let order = startOrder;

  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) continue;
    order += 1;
    const ext = imageExtension(file.type);
    prepared.push({
      file,
      storagePath: `products/${articleId}/${String(order).padStart(2, "0")}${ext}`,
      imageOrder: order,
      isPrimary: !hasPrimary && prepared.length === 0,
    });
  }

  return prepared;
}

async function uploadOneToStorage(
  userClient: SupabaseClient,
  serviceClient: SupabaseClient | null,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const attempt = async (client: SupabaseClient) =>
    client.storage.from("product-images").upload(path, buffer, {
      contentType,
      upsert: false,
    });

  let { error } = await attempt(userClient);
  if (!error) return { ok: true };

  if (isStorageDenied(error)) {
    try {
      const service = serviceClient ?? createServiceRoleClient();
      ({ error } = await attempt(service));
      if (!error) return { ok: true };
    } catch (e) {
      console.error("[uploadCataloguePhotos] service-role storage", e);
    }
  }

  console.error("[uploadCataloguePhotos] storage", { path, message: error?.message });
  return { ok: false, message: error?.message ?? "Upload failed." };
}

export async function uploadCataloguePhotosOnServer(
  userClient: SupabaseClient,
  user: UserProfile,
  articleId: string,
  files: File[]
): Promise<
  | { ok: true; imageIds: string[]; warnings: string[] }
  | { ok: false; message: string; imageIds?: string[]; warnings?: string[] }
> {
  if (files.length === 0) {
    return { ok: true, imageIds: [], warnings: [] };
  }

  const { maxOrder, hasPrimary } = await loadExistingImageMeta(userClient, articleId);
  const prepared = preparePhotoUploads(files, articleId, maxOrder, hasPrimary);

  if (prepared.length === 0) {
    return { ok: false, message: "No valid images to upload (JPEG, PNG, WebP, GIF — max 12 MB each)." };
  }

  let serviceClient: SupabaseClient | null = null;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    serviceClient = null;
  }

  const buffers = await Promise.all(prepared.map((p) => p.file.arrayBuffer()));
  const uploaded: PreparedPhotoUpload[] = [];
  const warnings: string[] = [];

  await runWithConcurrency(prepared, UPLOAD_CONCURRENCY, async (item, index) => {
    const buffer = Buffer.from(buffers[index]!);
    const result = await uploadOneToStorage(
      userClient,
      serviceClient,
      item.storagePath,
      buffer,
      item.file.type
    );
    if (result.ok) {
      uploaded.push(item);
    } else {
      warnings.push(`${item.file.name}: ${result.message}`);
    }
  });

  if (uploaded.length === 0) {
    return {
      ok: false,
      message: warnings[0] ?? "Unable to upload photos.",
      warnings,
    };
  }

  const insertRows = uploaded.map((item) => ({
    article_id: articleId,
    storage_path: item.storagePath,
    original_filename: item.file.name,
    mime_type: item.file.type,
    file_size: item.file.size,
    image_order: item.imageOrder,
    is_primary: item.isPrimary,
    verification_status: "VERIFIED" as const,
    manifest_confidence: "HIGH" as const,
  }));

  const tryInsert = async (client: SupabaseClient) =>
    client.from("article_images").insert(insertRows).select("id, image_order");

  let { data: inserted, error: insertError } = await tryInsert(userClient);

  if (insertError?.code === "42501" && serviceClient) {
    ({ data: inserted, error: insertError } = await tryInsert(serviceClient));
  }

  if (insertError || !inserted?.length) {
    logInsertFailure(user.id, articleId, insertError);
    return {
      ok: false,
      message: "Photos uploaded to storage but image records could not be saved.",
      warnings,
    };
  }

  const imageIds = (inserted as { id: string }[]).map((r) => r.id);

  return {
    ok: true,
    imageIds,
    warnings,
  };
}

function logInsertFailure(
  userId: string,
  articleId: string,
  error: PostgrestError | null
): void {
  console.error("[uploadCataloguePhotos] article_images insert", {
    userId,
    articleId,
    code: error?.code,
    message: error?.message,
    details: error?.details,
  });
}
