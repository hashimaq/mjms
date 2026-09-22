import { CatalogueSearchAsyncBody } from "@/components/catalogue/CatalogueSearchAsyncBody";
import { WorkspaceSearchToolbarSkeleton } from "@/components/workspace/WorkspacePageSkeletons";
import { parseCatalogueSearchParams } from "@/lib/catalogue/search-params";
import { Suspense } from "react";

type CatalogueSearchSectionProps = {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  heading?: string;
  lead?: string;
  searchNavigatePath?: string;
};

export function CatalogueSearchSection({
  basePath,
  searchParams: raw,
  heading = "Search catalogue",
  lead = "Find products by project name, article reference, season, category, and catalogue attributes.",
  searchNavigatePath,
}: CatalogueSearchSectionProps) {
  const params = parseCatalogueSearchParams(raw);

  return (
    <div className="mjms-workspace-page mjms-workspace-page--search">
      <header className="mjms-page-header mjms-page-header--hero">
        <div className="mjms-page-header-main">
          <p className="mjms-page-header-eyebrow">Product development</p>
          <h1 className="mjms-page-header-title">{heading}</h1>
          <p className="mjms-page-header-lead">{lead}</p>
        </div>
      </header>

      <Suspense fallback={<WorkspaceSearchToolbarSkeleton />}>
        <CatalogueSearchAsyncBody
          basePath={basePath}
          params={params}
          searchNavigatePath={searchNavigatePath}
        />
      </Suspense>
    </div>
  );
}
