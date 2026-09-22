import { CategoryFolderGrid } from "@/components/collections/CategoryFolderGrid";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { getSeasonCategorySummaries } from "@/lib/catalogue/category-summaries";
import { employeeCategoryPath, SEASONS, SEASON_SLUGS } from "@/lib/collections/config";
import Link from "next/link";

const SUMMARY_OPTS = { includePreviewImages: false as const };

export default async function EmployeeCataloguePage() {
  const [winterSummaries, summerSummaries] = await Promise.all([
    getSeasonCategorySummaries("winter", SUMMARY_OPTS),
    getSeasonCategorySummaries("summer", SUMMARY_OPTS),
  ]);

  return (
    <div className="mjms-workspace-page mjms-workspace-page--catalogue">
      <WorkspacePageHeader
        variant="hero"
        eyebrow="Product development"
        title="Catalogue"
        lead="Browse and manage the MJMS product catalogue by season and category."
        actions={
          <>
            <Link href="/employee/search" className="mjms-btn mjms-btn-primary mjms-btn-md" prefetch>
              Search catalogue
            </Link>
            <Link href="/employee/products/new" className="mjms-btn mjms-btn-secondary mjms-btn-md" prefetch>
              Add product
            </Link>
          </>
        }
      />

      <div className="mjms-catalogue-seasons">
        {SEASON_SLUGS.map((seasonSlug, index) => {
          const season = SEASONS[seasonSlug];
          const summaries = seasonSlug === "winter" ? winterSummaries : summerSummaries;
          return (
            <section
              key={seasonSlug}
              className="mjms-catalogue-season"
              aria-labelledby={`employee-${seasonSlug}-heading`}
            >
              <div className="mjms-catalogue-season-head">
                <h2 id={`employee-${seasonSlug}-heading`} className="mjms-catalogue-season-title">
                  {season.title}
                </h2>
                <p className="mjms-catalogue-season-lead">{season.description}</p>
              </div>
              <div className="mjms-catalogue-season-grid">
                <CategoryFolderGrid
                  season={season}
                  summaries={summaries}
                  getCategoryHref={employeeCategoryPath}
                />
              </div>
              {index < SEASON_SLUGS.length - 1 && (
                <hr className="mjms-catalogue-season-divider" aria-hidden />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
