"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { deleteCatalogueProduct } from "@/lib/catalogue/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteProductDialogProps = {
  open: boolean;
  onClose: () => void;
  articleId: string;
  projectName: string;
  /** Where to navigate after successful delete */
  redirectTo: string;
};

export function DeleteProductDialog({
  open,
  onClose,
  articleId,
  projectName,
  redirectTo,
}: DeleteProductDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const result = await deleteCatalogueProduct(articleId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "Unable to delete product.");
      return;
    }
    onClose();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={deleting ? () => {} : onClose}
      title="Delete project?"
      description="This action cannot be undone."
    >
      <div className="delete-product-dialog-body">
        <p>
          Permanently delete <strong>{projectName}</strong> and its photo gallery from the
          catalogue?
        </p>
        <ul className="delete-product-dialog-list">
          <li>Product record</li>
          <li>Photo metadata</li>
          <li>Stored image files for this product</li>
        </ul>
        <p className="delete-product-dialog-note">Activity history will retain a deletion audit entry.</p>
        {error && (
          <p className="catalogue-product-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="delete-product-dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" loading={deleting} onClick={() => void onConfirm()}>
            Delete project
          </Button>
        </div>
      </div>
    </Modal>
  );
}
