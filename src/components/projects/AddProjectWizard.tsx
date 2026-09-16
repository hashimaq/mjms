"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createProject, uploadSingleProjectPhoto } from "@/lib/projects/actions";
import type { CreateProjectResult } from "@/lib/projects/types";
import { UPLOAD_CONCURRENCY, runWithConcurrency } from "@/lib/projects/upload-utils";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PhotoSelectionPanel, type SelectedPhoto } from "./PhotoSelectionPanel";

type AddProjectWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

type SubmitPhase = "idle" | "creating" | "uploading" | "partial" | "error";

type FailedUpload = {
  photo: SelectedPhoto;
  error: string;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
}

export function AddProjectWizard({ open, onClose, onComplete }: AddProjectWizardProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const photosRef = useRef<SelectedPhoto[]>([]);

  const [step, setStep] = useState<1 | 2>(1);
  const [projectName, setProjectName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);

  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<CreateProjectResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [photosUploaded, setPhotosUploaded] = useState(0);
  const [totalPhotosAttempted, setTotalPhotosAttempted] = useState(0);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);

  photosRef.current = photos;

  useEffect(() => {
    if (open) return;

    photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    setStep(1);
    setProjectName("");
    setNameError(null);
    setPhotos([]);
    setPhase("idle");
    setCreateError(null);
    setCreatedProject(null);
    setUploadProgress({ completed: 0, total: 0 });
    setPhotosUploaded(0);
    setTotalPhotosAttempted(0);
    setFailedUploads([]);
    submittingRef.current = false;
  }, [open]);

  const isBusy = phase === "creating" || phase === "uploading";

  function handleNext() {
    const trimmed = projectName.trim();
    if (!trimmed) {
      setNameError("Project name is required.");
      return;
    }
    setNameError(null);
    setStep(2);
  }

  async function uploadPhotos(
    project: CreateProjectResult,
    items: SelectedPhoto[],
    options: { assignOrders: boolean; startOrder?: number }
  ): Promise<{ failures: FailedUpload[]; succeeded: number }> {
    const total = items.length;
    setUploadProgress({ total, completed: 0 });
    const failures: FailedUpload[] = [];
    let completed = 0;
    let succeeded = 0;

    await runWithConcurrency(items, UPLOAD_CONCURRENCY, async (photo, index) => {
      const formData = new FormData();
      formData.append("file", photo.file);

      const result = await uploadSingleProjectPhoto(
        project.articleId,
        project.slug,
        formData,
        options.assignOrders ? (options.startOrder ?? 1) + index : undefined
      );

      completed += 1;
      if (result.ok) succeeded += 1;
      else failures.push({ photo, error: result.error });

      setUploadProgress({ completed, total });
    });

    return { failures, succeeded };
  }

  async function handleSubmit() {
    if (submittingRef.current || isBusy) return;
    submittingRef.current = true;
    setCreateError(null);
    setFailedUploads([]);

    const trimmed = projectName.trim();
    if (!trimmed) {
      setNameError("Project name is required.");
      setStep(1);
      submittingRef.current = false;
      return;
    }

    try {
      setPhase("creating");
      const project = await createProject(trimmed);
      setCreatedProject(project);

      if (photos.length === 0) {
        onComplete?.();
        onClose();
        router.push(`/projects/${project.slug}`);
        return;
      }

      setPhase("uploading");
      setTotalPhotosAttempted(photos.length);
      const { failures, succeeded } = await uploadPhotos(project, photos, {
        assignOrders: true,
        startOrder: 1,
      });
      setPhotosUploaded(succeeded);

      if (failures.length === 0) {
        onComplete?.();
        onClose();
        router.push(`/projects/${project.slug}`);
        return;
      }

      setFailedUploads(failures);
      setPhase("partial");
    } catch (err) {
      setCreateError(errorMessage(err));
      setPhase("error");
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleRetryFailed() {
    if (!createdProject || failedUploads.length === 0 || submittingRef.current) return;

    submittingRef.current = true;
    setPhase("uploading");
    setCreateError(null);

    const retryItems = failedUploads.map((f) => f.photo);

    try {
      const { failures, succeeded } = await uploadPhotos(createdProject, retryItems, {
        assignOrders: false,
      });
      setPhotosUploaded((prev) => prev + succeeded);

      if (failures.length === 0) {
        onComplete?.();
        onClose();
        router.push(`/projects/${createdProject.slug}`);
        return;
      }

      setFailedUploads(failures);
      setPhase("partial");
    } catch (err) {
      setCreateError(errorMessage(err));
      setPhase("partial");
    } finally {
      submittingRef.current = false;
    }
  }

  function handleOpenProject() {
    if (!createdProject) return;
    onComplete?.();
    onClose();
    router.push(`/projects/${createdProject.slug}`);
  }

  return (
    <div className="space-y-5">
      <nav className="add-project-steps" aria-label="Add project steps">
        <StepIndicator label="Project Details" active={step === 1} complete={step > 1} />
        <span className="add-project-steps-divider" aria-hidden />
        <StepIndicator label="Photos" active={step === 2} complete={false} />
      </nav>

      {step === 1 && (
        <div className="space-y-5">
          <Input
            label="Project Name"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setNameError(null);
            }}
            placeholder="e.g. BIANCA"
            autoFocus
            error={nameError ?? undefined}
            disabled={isBusy}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isBusy}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleNext} disabled={isBusy}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="add-project-summary">
            <p className="mjms-label">Project Name</p>
            <p className="add-project-summary-name">{projectName.trim()}</p>
          </div>

          <div>
            <p className="mjms-label mb-3">Project Photos</p>
            <PhotoSelectionPanel
              photos={photos}
              onPhotosChange={setPhotos}
              disabled={isBusy || phase === "partial"}
            />
          </div>

          {phase === "creating" && (
            <div className="add-project-progress" role="status">
              <p className="text-sm font-medium text-foreground">Creating project…</p>
            </div>
          )}

          {phase === "uploading" && (
            <div className="add-project-progress space-y-2" role="status">
              <p className="text-sm font-medium text-foreground">Uploading photos</p>
              <div className="mjms-progress-track">
                <div
                  className="mjms-progress-bar"
                  style={{
                    width: `${
                      uploadProgress.total > 0
                        ? Math.round((uploadProgress.completed / uploadProgress.total) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mjms-meta">
                {uploadProgress.completed} of {uploadProgress.total} photos uploaded
              </p>
            </div>
          )}

          {createError && (
            <p className="mjms-alert mjms-alert-error" role="alert">
              {createError}
            </p>
          )}

          {phase === "partial" && createdProject && (
            <div className="mjms-alert mjms-alert-success space-y-2" role="status">
              <p className="font-medium">Project created successfully.</p>
              <p>
                {photosUploaded} of {totalPhotosAttempted} photos uploaded.
              </p>
              <p>
                {failedUploads.length} photo{failedUploads.length === 1 ? "" : "s"} failed to
                upload.
              </p>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button type="button" variant="primary" size="sm" onClick={() => void handleRetryFailed()}>
                  Retry Failed Uploads
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleOpenProject}>
                  Open Project
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (phase === "partial") {
                  handleOpenProject();
                  return;
                }
                setStep(1);
              }}
              disabled={isBusy}
            >
              Back
            </Button>
            {phase !== "partial" && (
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleSubmit()}
                loading={isBusy}
                disabled={isBusy}
              >
                Add Project
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`add-project-step ${active ? "add-project-step--active" : ""} ${
        complete ? "add-project-step--complete" : ""
      }`}
    >
      <span className="add-project-step-dot" aria-hidden>
        {complete ? <Check className="h-3 w-3" /> : null}
      </span>
      <span>{label}</span>
    </div>
  );
}
