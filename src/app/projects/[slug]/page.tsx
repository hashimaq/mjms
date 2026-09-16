import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/auth/session";
import {
  fetchProjectBySlug,
  fetchProjectPhotos,
} from "@/lib/projects/queries";
import { createRequestClient } from "@/lib/supabase/request";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  const supabase = await createRequestClient();

  try {
    const project = await fetchProjectBySlug(supabase, slug);

    if (!project) {
      return (
        <PageContainer className="py-16">
          <EmptyState
            icon={AlertCircle}
            title="Project not found."
            description="This project may have been removed or the link is incorrect."
            action={
              <Link href="/projects">
                <Button variant="secondary">Back to Projects</Button>
              </Link>
            }
          />
        </PageContainer>
      );
    }

    const { photos, total } = await fetchProjectPhotos(supabase, project.articleIds, {
      limit: 24,
    });

    return (
      <ProjectDetailClient
        project={{ ...project, photoCount: total }}
        initialPhotos={photos}
        initialTotal={total}
        user={user!}
      />
    );
  } catch {
    return (
      <PageContainer className="py-16">
        <EmptyState
          icon={AlertCircle}
          title="Something went wrong while loading this project."
          description="Please try again in a moment."
          action={
            <Link href={`/projects/${slug}`}>
              <Button variant="primary">Try again</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }
}
