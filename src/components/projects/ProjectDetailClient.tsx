"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { ImageUpload } from "@/components/photos/ImageUpload";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { updateProject, uploadProjectPhotos } from "@/lib/projects/actions";
import type { ProjectPhoto, ProjectSummary, UserProfile } from "@/lib/projects/types";
import { formatPhotoCount } from "@/lib/utils";
import { ArrowLeft, ImagePlus, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProjectForm } from "./ProjectForm";

type ProjectDetailClientProps = {
  project: ProjectSummary;
  initialPhotos: ProjectPhoto[];
  initialTotal: number;
  user: UserProfile;
};

export function ProjectDetailClient({
  project,
  initialPhotos,
  initialTotal,
  user,
}: ProjectDetailClientProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const isAdmin = user.role === "admin";

  async function handleUpload(files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    await uploadProjectPhotos(project.slug, formData);
    setShowUpload(false);
    startTransition(() => router.refresh());
  }

  return (
    <PageContainer narrow className="catalog-content">
      <div className="mb-6">
        <Link href="/projects" className="mjms-back-link">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </Link>
      </div>

      <header className="mjms-detail-header">
        <div className="min-w-0 flex-1">
          <h1 className="mjms-page-title truncate">{project.name}</h1>
          <p className="mjms-meta mt-1.5">{formatPhotoCount(project.photoCount)}</p>
          <div className="catalog-brand-stripe mt-4" aria-hidden />
        </div>

        {isAdmin && (
          <div className="flex shrink-0 flex-wrap gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit Project
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
              <ImagePlus className="h-3.5 w-3.5" />
              Add Photos
            </Button>
          </div>
        )}
      </header>

      <section className="mt-8 sm:mt-10">
        <PhotoGallery
          slug={project.slug}
          initialPhotos={initialPhotos}
          initialTotal={initialTotal}
        />
      </section>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Project"
        description="Update the project name."
      >
        <ProjectForm
          mode="edit"
          initialName={project.name}
          onCancel={() => setShowEdit(false)}
          onSubmit={async (name) => {
            await updateProject(project.slug, name);
            setShowEdit(false);
            startTransition(() => router.refresh());
          }}
        />
      </Modal>

      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Add Photos"
        description={`Upload photos to ${project.name}.`}
        className="max-w-xl"
      >
        <ImageUpload onCancel={() => setShowUpload(false)} onUpload={handleUpload} />
      </Modal>
    </PageContainer>
  );
}
