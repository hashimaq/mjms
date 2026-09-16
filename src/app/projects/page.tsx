import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";
import { getSessionUser } from "@/lib/auth/session";
import { buildProjectSummaries } from "@/lib/projects/queries";
import type { ProjectSummary } from "@/lib/projects/types";
import { createRequestClient } from "@/lib/supabase/request";

export default async function ProjectsPage() {
  const user = await getSessionUser();
  const supabase = await createRequestClient();

  let projects: ProjectSummary[] = [];
  let error: string | null = null;

  try {
    projects = await buildProjectSummaries(supabase);
  } catch {
    error = "load_failed";
  }

  return (
    <ProjectsPageClient
      projects={projects}
      user={user!}
      error={error}
    />
  );
}
