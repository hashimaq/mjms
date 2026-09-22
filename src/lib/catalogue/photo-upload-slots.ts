import { imageExtension } from "@/lib/projects/upload-utils";

export const MAX_CATALOGUE_PHOTO_BYTES = 12 * 1024 * 1024;

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type PhotoSlotCandidate = {
  clientId: string;
  name: string;
  size: number;
  mimeType: string;
};

export type PreparedPhotoSlot = {
  clientId: string;
  storagePath: string;
  imageOrder: number;
  isPrimary: boolean;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
};

export function validateCataloguePhotoFile(file: File): string | null {
  if (!file.type.startsWith("image/") || !ALLOWED.has(file.type)) {
    return `${file.name}: unsupported format (use JPEG, PNG, WebP, or GIF).`;
  }
  if (file.size > MAX_CATALOGUE_PHOTO_BYTES) {
    return `${file.name}: must be 12 MB or smaller.`;
  }
  if (file.size === 0) {
    return `${file.name}: file is empty.`;
  }
  return null;
}

export function fileToSlotCandidate(file: File, clientId: string): PhotoSlotCandidate {
  return {
    clientId,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

export function preparePhotoSlots(
  candidates: PhotoSlotCandidate[],
  articleId: string,
  startOrder: number,
  hasPrimary: boolean
): PreparedPhotoSlot[] {
  const prepared: PreparedPhotoSlot[] = [];
  let order = startOrder;

  for (const candidate of candidates) {
    const err = validateCataloguePhotoCandidate(candidate);
    if (err) continue;
    order += 1;
    const ext = imageExtension(candidate.mimeType);
    prepared.push({
      clientId: candidate.clientId,
      storagePath: `products/${articleId}/${String(order).padStart(2, "0")}${ext}`,
      imageOrder: order,
      isPrimary: !hasPrimary && prepared.length === 0,
      originalFilename: candidate.name,
      mimeType: candidate.mimeType,
      fileSize: candidate.size,
    });
  }

  return prepared;
}

function validateCataloguePhotoCandidate(c: PhotoSlotCandidate): string | null {
  if (!ALLOWED.has(c.mimeType)) return "unsupported format";
  if (c.size > MAX_CATALOGUE_PHOTO_BYTES) return "too large";
  if (c.size <= 0) return "empty";
  return null;
}
