export function WorkspaceMetricsSkeleton() {
  return (
    <section className="mjms-dashboard-section" aria-hidden>
      <div className="mjms-skeleton mjms-skeleton-title" />
      <div className="mjms-stat-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mjms-stat-card mjms-skeleton-block" />
        ))}
      </div>
    </section>
  );
}

export function WorkspacePanelSkeleton({ tall }: { tall?: boolean }) {
  return (
    <section
      className={`mjms-panel mjms-skeleton-block ${tall ? "mjms-skeleton-block--tall" : ""}`}
      aria-hidden
    />
  );
}

export function WorkspacePageHeaderSkeleton() {
  return (
    <div
      className="mjms-page-header mjms-page-header--hero mjms-skeleton-block mjms-skeleton-hero"
      aria-hidden
    />
  );
}

export function WorkspaceCatalogueSkeleton() {
  return (
    <div className="mjms-skeleton-catalogue" aria-hidden>
      <div className="mjms-skeleton mjms-skeleton-title" />
      <div className="mjms-skeleton mjms-skeleton-lead" />
      <div className="mjms-skeleton-folder-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mjms-skeleton-folder-card" />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceSearchToolbarSkeleton() {
  return (
    <div className="mjms-search-panel mjms-skeleton-block" style={{ minHeight: "14rem" }} aria-hidden />
  );
}

export function WorkspaceSearchSkeleton() {
  return (
    <div className="mjms-workspace-page mjms-workspace-page--search" aria-hidden>
      <WorkspacePageHeaderSkeleton />
      <WorkspaceSearchToolbarSkeleton />
    </div>
  );
}

export function WorkspaceFormSkeleton() {
  return (
    <div className="mjms-panel mjms-skeleton-block mjms-skeleton-form" aria-hidden />
  );
}

export function WorkspaceCategoryGridSkeleton() {
  return (
    <div className="mjms-category-results" aria-hidden>
      <div className="mjms-skeleton mjms-skeleton-title" style={{ width: "10rem" }} />
      <div className="mjms-skeleton mjms-skeleton-lead" style={{ width: "14rem" }} />
      <div className="mjms-skeleton-product-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mjms-skeleton-product-card" />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceCategoryPageSkeleton() {
  return (
    <div className="mjms-workspace-page mjms-workspace-page--category" aria-hidden>
      <div className="mjms-page-header mjms-page-header--hero mjms-skeleton-block mjms-skeleton-hero" />
      <div className="mjms-skeleton mjms-skeleton-toolbar" style={{ minHeight: "3rem" }} />
      <WorkspaceCategoryGridSkeleton />
    </div>
  );
}
