"use client";

import { Button } from "@/components/ui/Button";
import type { CataloguePhotoUploadProgress as ProgressState } from "@/lib/catalogue/upload-catalogue-photos-client";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";

type CataloguePhotoUploadProgressProps = {
  progress: ProgressState | null;
  onRetryFailed?: () => void;
  retrying?: boolean;
};

export function CataloguePhotoUploadProgressPanel({
  progress,
  onRetryFailed,
  retrying = false,
}: CataloguePhotoUploadProgressProps) {
  if (!progress || progress.total === 0) return null;

  const pct =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const failed = progress.items.filter((i) => i.status === "error");
  const inFlight = progress.items.some(
    (i) => i.status === "uploading" || i.status === "pending"
  );

  return (
    <div className="catalogue-upload-progress" role="status" aria-live="polite">
      <div className="catalogue-upload-progress-header">
        <span className="catalogue-upload-progress-title">Uploading photos</span>
        <span className="catalogue-upload-progress-count">
          {progress.completed} / {progress.total}
        </span>
      </div>
      <div
        className="catalogue-upload-progress-bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="catalogue-upload-progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="catalogue-upload-progress-list">
        {progress.items.map((item) => (
          <li key={item.clientId} className="catalogue-upload-progress-item">
            <StatusIcon status={item.status} />
            <span className="catalogue-upload-progress-name">{item.fileName}</span>
            {item.message && item.status === "error" && (
              <span className="catalogue-upload-progress-error">{item.message}</span>
            )}
          </li>
        ))}
      </ul>
      {failed.length > 0 && onRetryFailed && !inFlight && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={retrying}
          onClick={onRetryFailed}
        >
          Retry {failed.length} failed photo{failed.length === 1 ? "" : "s"}
        </Button>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: ProgressState["items"][0]["status"] }) {
  if (status === "done") {
    return <Check className="catalogue-upload-progress-icon catalogue-upload-progress-icon--done" aria-hidden />;
  }
  if (status === "error") {
    return <X className="catalogue-upload-progress-icon catalogue-upload-progress-icon--error" aria-hidden />;
  }
  if (status === "uploading") {
    return <Loader2 className="catalogue-upload-progress-icon catalogue-upload-progress-icon--spin" aria-hidden />;
  }
  return <span className={cn("catalogue-upload-progress-icon", "catalogue-upload-progress-icon--pending")} aria-hidden />;
}
