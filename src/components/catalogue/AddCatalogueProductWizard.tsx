"use client";

import { Button } from "@/components/ui/Button";
import { CataloguePhotoUploadProgressPanel } from "@/components/catalogue/CataloguePhotoUploadProgress";
import { ProductFormFields, type ProductFormState } from "@/components/catalogue/ProductFormFields";
import { ProductPhotoPicker, type PendingPhoto } from "@/components/catalogue/ProductPhotoPicker";
import { createCatalogueProduct, setCataloguePrimaryPhoto } from "@/lib/catalogue/actions";
import { productDetailPath } from "@/lib/catalogue/paths";
import {
  retryFailedCataloguePhotoUploads,
  uploadCataloguePhotosViaStorage,
  type CataloguePhotoUploadProgress,
} from "@/lib/catalogue/upload-catalogue-photos-client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const STEPS = ["Basic information", "Product information", "Photos"] as const;

type SavePhase = "idle" | "creating" | "uploading" | "finishing";

export function AddCatalogueProductWizard() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<SavePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<CataloguePhotoUploadProgress | null>(null);
  const [createdArticleId, setCreatedArticleId] = useState<string | null>(null);
  const [failedUploadItems, setFailedUploadItems] = useState<
    { clientId: string; file: File }[]
  >([]);
  const [form, setForm] = useState<ProductFormState>({
    projectName: "",
    season: "winter",
    category: "heel",
  });
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);

  const busy = phase !== "idle";

  const canAdvance = useMemo(() => {
    if (step === 0) return form.projectName.trim().length > 0;
    return true;
  }, [form.projectName, step]);

  const statusLabel = useMemo(() => {
    if (phase === "creating") return "Creating product…";
    if (phase === "uploading" && photos.length > 0) {
      return `Preparing ${photos.length} photo${photos.length === 1 ? "" : "s"}…`;
    }
    if (phase === "finishing") return "Saving gallery…";
    return null;
  }, [phase, photos.length]);

  async function runPhotoUpload(articleId: string, items: { clientId: string; file: File }[]) {
    setPhase("uploading");
    setUploadProgress({
      completed: 0,
      total: items.length,
      items: items.map(({ clientId, file }) => ({
        clientId,
        fileName: file.name,
        status: "pending",
      })),
    });

    return uploadCataloguePhotosViaStorage(articleId, items, setUploadProgress);
  }

  async function applyPrimaryPhoto(
    articleId: string,
    uploadResult: Awaited<ReturnType<typeof uploadCataloguePhotosViaStorage>>,
    sourcePhotos: PendingPhoto[]
  ) {
    if (!uploadResult.ok) return;
    const primaryPhotoId = primaryId ?? sourcePhotos[0]?.id ?? null;
    if (!primaryPhotoId || sourcePhotos.length <= 1) return;

    const dbId = uploadResult.imageIdsByClientId[primaryPhotoId];
    if (!dbId) return;

    setPhase("finishing");
    await setCataloguePrimaryPhoto(articleId, dbId);
  }

  async function onSave() {
    if (submittingRef.current || busy) return;
    submittingRef.current = true;
    setError(null);
    setCreatedArticleId(null);
    setFailedUploadItems([]);
    setPhase("creating");

    const created = await createCatalogueProduct(form);
    if (!created.ok) {
      setPhase("idle");
      submittingRef.current = false;
      setError(created.message);
      return;
    }

    const articleId = created.articleId;
    setCreatedArticleId(articleId);

    if (photos.length > 0) {
      const items = photos.map((p) => ({ clientId: p.id, file: p.file }));
      const upload = await runPhotoUpload(articleId, items);

      if (!upload.ok) {
        setPhase("idle");
        submittingRef.current = false;
        setError(`Product created, but photos failed: ${upload.message}`);
        setFailedUploadItems(items);
        return;
      }

      await applyPrimaryPhoto(articleId, upload, photos);

      if (upload.failures.length > 0) {
        setFailedUploadItems(
          upload.failures.map((f) => ({
            clientId: f.clientId,
            file: photos.find((p) => p.id === f.clientId)!.file,
          }))
        );
        setError(
          `Product created. ${upload.failures.length} of ${photos.length} photo(s) failed — retry below or open the product to add more.`
        );
        setPhase("idle");
        submittingRef.current = false;
        return;
      }
    }

    setPhase("idle");
    submittingRef.current = false;
    setUploadProgress(null);
    router.push(productDetailPath(articleId));
    router.refresh();
  }

  async function onRetryFailed() {
    if (!createdArticleId || failedUploadItems.length === 0 || busy) return;
    submittingRef.current = true;
    setError(null);

    const upload = await retryFailedCataloguePhotoUploads(
      createdArticleId,
      failedUploadItems,
      setUploadProgress
    );

    if (!upload.ok) {
      setError(upload.message);
      submittingRef.current = false;
      return;
    }

    if (upload.failures.length > 0) {
      setFailedUploadItems(
        upload.failures.map((f) => ({
          clientId: f.clientId,
          file: failedUploadItems.find((i) => i.clientId === f.clientId)!.file,
        }))
      );
      setError(`${upload.failures.length} photo(s) still failed.`);
      submittingRef.current = false;
      return;
    }

    setFailedUploadItems([]);
    setUploadProgress(null);
    submittingRef.current = false;
    router.push(productDetailPath(createdArticleId));
    router.refresh();
  }

  function goToCreatedProduct() {
    if (createdArticleId) {
      router.push(productDetailPath(createdArticleId));
      router.refresh();
    }
  }

  return (
    <div className="catalogue-product-wizard">
      <ol className="catalogue-product-wizard-steps" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "catalogue-product-wizard-step",
              index === step && "catalogue-product-wizard-step--active",
              index < step && "catalogue-product-wizard-step--done"
            )}
          >
            <span className="catalogue-product-wizard-step-num">{index + 1}</span>
            <span className="catalogue-product-wizard-step-label">{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && <ProductFormFields form={form} onChange={setForm} step={0} />}
      {step === 1 && <ProductFormFields form={form} onChange={setForm} step={1} />}
      {step === 2 && (
        <ProductPhotoPicker
          photos={photos}
          primaryId={primaryId}
          onPhotosChange={setPhotos}
          onPrimaryChange={setPrimaryId}
        />
      )}

      {statusLabel && phase !== "uploading" && (
        <p className="catalogue-product-form-status" role="status">
          {statusLabel}
        </p>
      )}

      <CataloguePhotoUploadProgressPanel
        progress={uploadProgress}
        onRetryFailed={failedUploadItems.length > 0 ? () => void onRetryFailed() : undefined}
        retrying={busy && failedUploadItems.length > 0}
      />

      {error && (
        <p className="catalogue-product-form-error" role="alert">
          {error}
        </p>
      )}

      {createdArticleId && failedUploadItems.length > 0 && (
        <Button type="button" variant="secondary" onClick={goToCreatedProduct}>
          Open created product
        </Button>
      )}

      <div className="catalogue-product-wizard-actions">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={busy}>
            Back
          </Button>
        )}
        {step < STEPS.length - 1 && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance || busy}
          >
            Continue
          </Button>
        )}
        {step === STEPS.length - 1 && (
          <Button type="button" variant="primary" loading={busy} onClick={() => void onSave()}>
            Save product
          </Button>
        )}
      </div>
    </div>
  );
}
