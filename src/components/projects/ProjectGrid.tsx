"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import type { ProjectSummary } from "@/lib/projects/types";
import { FolderOpen, SearchX } from "lucide-react";
import { ProjectCard } from "./ProjectCard";

type ProjectGridProps = {
  projects: ProjectSummary[];
  searchQuery: string;
  addProjectAction?: React.ReactNode;
};

export function ProjectGrid({
  projects,
  searchQuery,
  addProjectAction,
}: ProjectGridProps) {
  if (projects.length === 0 && !searchQuery) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Your projects will appear here."
        description="Create a project to start organizing product development photos."
        action={addProjectAction}
      />
    );
  }

  if (projects.length === 0 && searchQuery) {
    return (
      <EmptyState
        icon={SearchX}
        title="No projects found."
        description={`No projects match "${searchQuery}". Try a different search term.`}
      />
    );
  }

  return (
    <div className="catalog-grid">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.slug}
          project={project}
          accentIndex={index}
          style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
        />
      ))}
    </div>
  );
}
