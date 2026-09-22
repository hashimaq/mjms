"use client";

import { CataloguePhotoUploadProgressPanel } from "@/components/catalogue/CataloguePhotoUploadProgress";
import { workspaceEditProductPath, workspaceNewProductPath } from "@/lib/catalogue/workspace-product-paths";
import {
  uploadCataloguePhotosViaStorage,
  type CataloguePhotoUploadProgress,
} from "@/lib/catalogue/upload-catalogue-photos-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductStaffToolsProps = {
  articleId: string;
  canUpload: boolean;
  role: "admin" | "staff";
};

export function ProductStaffTools({ articleId, canUpload, role }: ProductStaffToolsProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<CataloguePhotoUploadProgress | null>(null);

  if (!canUpload) return null;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const clientId = `${file.name}-${file.size}-${crypto.randomUUID()}`;
    const result = await uploadCataloguePhotosViaStorage(
      articleId,
      [{ clientId, file }],
      setUploadProgress
    );
    setUploading(false);
    setUploadProgress(null);
    e.target.value = "";
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    if (result.failures.length > 0) {
      setMessage(result.failures[0]?.message ?? "Upload failed.");
      return;
    }
    setMessage("Photo uploaded.");
    router.refresh();
  }

  return (
    <section className="product-staff-tools" aria-labelledby="product-staff-tools-heading">
      <h2 id="product-staff-tools-heading" className="product-staff-tools-title">
        Catalogue management
      </h2>
      <label className="product-staff-upload">
        <span className="mjms-btn mjms-btn-secondary mjms-btn-sm">
          {uploading ? "Uploading…" : "Upload photo"}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => void onFileChange(e)}
        />
      </label>
      <CataloguePhotoUploadProgressPanel progress={uploadProgress} />
      {message && (
        <p className="product-staff-message" role="status">
          {message}
        </p>
      )}
      <Link href={workspaceEditProductPath(role, articleId)} className="mjms-btn mjms-btn-primary mjms-btn-sm">
        Edit product
      </Link>
      <Link href={workspaceNewProductPath(role)} className="mjms-btn mjms-btn-ghost mjms-btn-sm">
        Add another product
      </Link>
    </section>
  );
}
