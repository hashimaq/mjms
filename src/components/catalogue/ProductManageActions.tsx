"use client";

import { DeleteProductDialog } from "@/components/catalogue/DeleteProductDialog";
import { workspaceEditProductPath } from "@/lib/catalogue/workspace-product-paths";
import Link from "next/link";
import { useState } from "react";

type ProductManageActionsProps = {
  articleId: string;
  projectName: string;
  role: "admin" | "staff";
  redirectAfterDelete: string;
  variant?: "detail" | "edit";
};

export function ProductManageActions({
  articleId,
  projectName,
  role,
  redirectAfterDelete,
  variant = "detail",
}: ProductManageActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canDelete = role === "admin";

  return (
    <div className={variant === "detail" ? "product-manage-actions" : "product-manage-actions product-manage-actions--edit-footer"}>
      {variant === "detail" && (
        <Link
          href={workspaceEditProductPath(role, articleId)}
          className="mjms-btn mjms-btn-primary mjms-btn-md"
        >
          Edit product
        </Link>
      )}
      {canDelete && (
        <>
          <button
            type="button"
            className="mjms-btn mjms-btn-destructive mjms-btn-md"
            onClick={() => setDeleteOpen(true)}
          >
            Delete project
          </button>
          <DeleteProductDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            articleId={articleId}
            projectName={projectName}
            redirectTo={redirectAfterDelete}
          />
        </>
      )}
    </div>
  );
}
