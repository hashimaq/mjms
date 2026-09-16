"use client";

import { CatalogHeroDecor } from "@/components/layout/CatalogHeroDecor";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProjectGridSkeleton } from "@/components/ui/LoadingSkeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ProjectSummary, UserProfile } from "@/lib/projects/types";
import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddProjectWizard } from "./AddProjectWizard";
import { ProjectGrid } from "./ProjectGrid";
import { ProjectSearch } from "./ProjectSearch";

type ProjectsPageClientProps = {
  projects: ProjectSummary[];
  user: UserProfile;
  error?: string | null;
};

export function ProjectsPageClient({ projects, user, error }: ProjectsPageClientProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isAdmin = user.role === "admin";

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, debouncedSearch]);

  const addButton = isAdmin ? (
    <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
      <Plus className="h-3.5 w-3.5" />
      Add Project
    </Button>
  ) : null;

  return (
    <PageContainer className="catalog-content">
      <section className="catalog-hero mjms-fade-in">
        <CatalogHeroDecor />
        <div className="catalog-hero-head">
          <div className="min-w-0 flex-1">
            <h1 className="catalog-hero-title">Projects</h1>
            <p className="catalog-hero-eyebrow">Product Development Catalogue</p>
            <p className="catalog-hero-description">
              Search and explore product projects and their associated samples.
            </p>
          </div>
          {addButton && <div className="catalog-hero-action">{addButton}</div>}
        </div>

        <ProjectSearch value={search} onChange={setSearch} />
      </section>

      {error && (
        <div className="mjms-alert mjms-alert-error mb-6">
          Something went wrong while loading projects. Please try again.
        </div>
      )}

      <section className="catalog-grid-section">
        {isPending ? (
          <ProjectGridSkeleton />
        ) : (
          <ProjectGrid
            projects={filtered}
            searchQuery={debouncedSearch}
            addProjectAction={addButton}
          />
        )}
      </section>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Project"
        className="max-w-xl"
      >
        <AddProjectWizard
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onComplete={() => startTransition(() => router.refresh())}
        />
      </Modal>
    </PageContainer>
  );
}
