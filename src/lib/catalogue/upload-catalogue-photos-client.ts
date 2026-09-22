"use client";

import {
  allocateCataloguePhotoUploadSlots,
  registerCataloguePhotoUploads,
} from "@/lib/catalogue/actions";
import type { PhotoSlotCandidate } from "@/lib/catalogue/photo-upload-slots";
import {
  fileToSlotCandidate,
  validateCataloguePhotoFile,
} from "@/lib/catalogue/photo-upload-slots";
import { runWithConcurrency } from "@/lib/projects/upload-utils";
import { createClient } from "@/lib/supabase/client";

/** Browser → Storage uploads; server only receives JSON metadata (no multipart file bodies). */
export const CLIENT_PHOTO_UPLOAD_CONCURRENCY = 4;

export type PhotoUploadItemStatus = "pending" | "uploading" | "done" | "error";

export type PhotoUploadItemState = {
  clientId: string;
  fileName: string;
  status: PhotoUploadItemStatus;
  message?: string;
};

export type CataloguePhotoUploadProgress = {
  completed: number;
  total: number;
  items: PhotoUploadItemState[];
};

export type CataloguePhotoUploadResult =
  | {
      ok: true;
      imageIdsByClientId: Record<string, string>;
      failures: { clientId: string; message: string }[];
    }
  | { ok: false; message: string };

type UploadItem = {
  clientId: string;
  file: File;
};

export async function uploadCataloguePhotosViaStorage(
  articleId: string,
  uploadItems: UploadItem[],
  onProgress?: (p: CataloguePhotoUploadProgress) => void
): Promise<CataloguePhotoUploadResult> {
  if (uploadItems.length === 0) {
    return { ok: true, imageIdsByClientId: {}, failures: [] };
  }

  const itemStates: PhotoUploadItemState[] = uploadItems.map(({ clientId, file }) => ({
    clientId,
    fileName: file.name,
    status: "pending",
  }));

  const notify = () => {
    if (!onProgress) return;
    const completed = itemStates.filter((i) => i.status === "done").length;
    onProgress({
      completed,
      total: itemStates.length,
      items: itemStates.map((i) => ({ ...i })),
    });
  };

  for (const { file } of uploadItems) {
    const validation = validateCataloguePhotoFile(file);
    if (validation) {
      return { ok: false, message: validation };
    }
  }

  notify();

  const candidates: PhotoSlotCandidate[] = uploadItems.map(({ clientId, file }) =>
    fileToSlotCandidate(file, clientId)
  );

  const allocated = await allocateCataloguePhotoUploadSlots(articleId, candidates);
  if (!allocated.ok) {
    return { ok: false, message: allocated.message };
  }

  const slotByClientId = new Map(allocated.slots.map((s) => [s.clientId, s]));
  const supabase = createClient();
  const successes: typeof allocated.slots = [];
  const failures: { clientId: string; message: string }[] = [];

  await runWithConcurrency(uploadItems, CLIENT_PHOTO_UPLOAD_CONCURRENCY, async (item) => {
    const slot = slotByClientId.get(item.clientId);
    if (!slot) {
      failures.push({ clientId: item.clientId, message: "No upload slot allocated." });
      const row = itemStates.find((s) => s.clientId === item.clientId);
      if (row) {
        row.status = "error";
        row.message = "No upload slot allocated.";
      }
      notify();
      return;
    }

    const row = itemStates.find((s) => s.clientId === item.clientId);
    if (row) row.status = "uploading";
    notify();

    const { error } = await supabase.storage
      .from("product-images")
      .upload(slot.storagePath, item.file, {
        contentType: item.file.type,
        upsert: false,
      });

    if (error) {
      const message = error.message || "Storage upload failed.";
      failures.push({ clientId: item.clientId, message });
      if (row) {
        row.status = "error";
        row.message = message;
      }
      notify();
      return;
    }

    successes.push(slot);
    if (row) {
      row.status = "done";
      row.message = undefined;
    }
    notify();
  });

  if (successes.length === 0) {
    return {
      ok: false,
      message: failures[0]?.message ?? "Unable to upload photos.",
    };
  }

  const registered = await registerCataloguePhotoUploads(
    articleId,
    successes.map((s) => ({
      clientId: s.clientId,
      storagePath: s.storagePath,
      originalFilename: s.originalFilename,
      mimeType: s.mimeType,
      fileSize: s.fileSize,
      imageOrder: s.imageOrder,
      isPrimary: s.isPrimary,
    }))
  );

  if (!registered.ok) {
    return { ok: false, message: registered.message };
  }

  const imageIdsByClientId: Record<string, string> = { ...registered.imageIdsByClientId };

  return {
    ok: true,
    imageIdsByClientId,
    failures,
  };
}

/** Upload only items currently in error state (new slots allocated server-side). */
export async function retryFailedCataloguePhotoUploads(
  articleId: string,
  uploadItems: UploadItem[],
  onProgress?: (p: CataloguePhotoUploadProgress) => void
): Promise<CataloguePhotoUploadResult> {
  return uploadCataloguePhotosViaStorage(articleId, uploadItems, onProgress);
}
