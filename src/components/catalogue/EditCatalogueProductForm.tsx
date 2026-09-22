"use client";

import { Button } from "@/components/ui/Button";
import { CataloguePhotoUploadProgressPanel } from "@/components/catalogue/CataloguePhotoUploadProgress";
import { ExistingProductGallery } from "@/components/catalogue/ExistingProductGallery";
import { ProductFormFields, type ProductFormState } from "@/components/catalogue/ProductFormFields";
import { ProductManageActions } from "@/components/catalogue/ProductManageActions";
import { ProductPhotoPicker, type PendingPhoto } from "@/components/catalogue/ProductPhotoPicker";
import { setCataloguePrimaryPhoto, updateCatalogueProduct } from "@/lib/catalogue/actions";
import type { ArticleEditRecord } from "@/lib/catalogue/get-article-for-edit";
import { productDetailPath } from "@/lib/catalogue/paths";
import {
  uploadCataloguePhotosViaStorage,
  type CataloguePhotoUploadProgress,
} from "@/lib/catalogue/upload-catalogue-photos-client";
import { categoryPath } from "@/lib/collections/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type SavePhase = "idle" | "saving" | "uploading" | "finishing";

type EditCatalogueProductFormProps = {
  article: ArticleEditRecord;
  canDeletePhotos: boolean;
  role: "admin" | "staff";
};

export function EditCatalogueProductForm({
  article,
  canDeletePhotos,
  role,
}: EditCatalogueProductFormProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [phase, setPhase] = useState<SavePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<CataloguePhotoUploadProgress | null>(null);
  const [form, setForm] = useState<ProductFormState>({
    projectName: article.projectName,
    articleReference: article.articleReference ?? undefined,
    season: article.season,
    category: article.category,
    making: article.making ?? undefined,
    type: article.type ?? undefined,
    material: article.material ?? undefined,
    colour: article.colour ?? undefined,
    sizeRange: article.sizeRange ?? undefined,
    qty: article.qty ?? undefined,
    remarks: article.remarks ?? undefined,
  });
  const [newPhotos, setNewPhotos] = useState<PendingPhoto[]>([]);
  const [primaryNewId, setPrimaryNewId] = useState<string | null>(null);

  const busy = phase !== "idle";
  const statusLabel = useMemo(() => {
    if (phase === "saving") return "Saving product…";
    if (phase === "uploading") return "Uploading new photos…";
    if (phase === "finishing") return "Finishing…";
    return null;
  }, [phase]);

  async function onSave() {
    if (submittingRef.current || busy) return;
    submittingRef.current = true;
    setError(null);
    setPhase("saving");

    const updated = await updateCatalogueProduct({ ...form, articleId: article.id });
    if (!updated.ok) {
      setPhase("idle");
      submittingRef.current = false;
      setError(updated.message);
      return;
    }

    if (newPhotos.length > 0) {
      setPhase("uploading");
      const items = newPhotos.map((p) => ({ clientId: p.id, file: p.file }));
      setUploadProgress({
        completed: 0,
        total: items.length,
        items: items.map(({ clientId, file }) => ({
          clientId,
          fileName: file.name,
          status: "pending",
        })),
      });

      const upload = await uploadCataloguePhotosViaStorage(article.id, items, setUploadProgress);

      if (!upload.ok) {
        setPhase("idle");
        submittingRef.current = false;
        setError(upload.message);
        router.refresh();
        return;
      }

      const primaryNew = primaryNewId ?? newPhotos[0]?.id;
      if (primaryNew) {
        const imageId = upload.imageIdsByClientId[primaryNew];
        if (imageId) {
          setPhase("finishing");
          await setCataloguePrimaryPhoto(article.id, imageId);
        }
      }

      if (upload.failures.length > 0) {
        setError(
          `Saved. ${upload.failures.length} of ${newPhotos.length} new photo(s) failed to upload.`
        );
        setPhase("idle");
        submittingRef.current = false;
        router.refresh();
        return;
      }
    }

    setPhase("idle");
    submittingRef.current = false;
    setUploadProgress(null);
    router.push(productDetailPath(article.id));
    router.refresh();
  }

  return (
    <div className="catalogue-product-wizard">
      <ProductFormFields form={form} onChange={setForm} step={0} />
      <ProductFormFields form={form} onChange={setForm} step={1} />

      <section className="catalogue-product-form-section">
        <h2 className="catalogue-product-form-heading">
          Current gallery
          {article.photoCount > 0 && (
            <span className="catalogue-product-form-heading-count">
              {" "}
              · {article.photoCount} photo{article.photoCount === 1 ? "" : "s"}
            </span>
          )}
        </h2>
        <ExistingProductGallery
          articleId={article.id}
          images={article.images}
          canDeletePhotos={canDeletePhotos}
        />
      </section>

      <ProductPhotoPicker
        photos={newPhotos}
        primaryId={primaryNewId}
        onPhotosChange={setNewPhotos}
        onPrimaryChange={setPrimaryNewId}
      />

      {statusLabel && phase !== "uploading" && (
        <p className="catalogue-product-form-status" role="status">
          {statusLabel}
        </p>
      )}

      <CataloguePhotoUploadProgressPanel progress={uploadProgress} />

      {error && (
        <p className="catalogue-product-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="catalogue-product-wizard-actions catalogue-product-wizard-actions--split">
        <div className="catalogue-product-wizard-actions-primary">
          <Link href={productDetailPath(article.id)} className="mjms-btn mjms-btn-secondary mjms-btn-md">
            Cancel
          </Link>
          <Button type="button" variant="primary" loading={busy} onClick={() => void onSave()}>
            Save changes
          </Button>
        </div>
        <ProductManageActions
          articleId={article.id}
          projectName={article.projectName}
          role={role}
          redirectAfterDelete={categoryPath(article.season, article.category)}
          variant="edit"
        />
      </div>
    </div>
  );
}
