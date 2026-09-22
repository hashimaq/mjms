import type { ReactNode } from "react";

type WorkspacePageHeaderProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
  variant?: "default" | "hero";
};

export function WorkspacePageHeader({
  eyebrow,
  title,
  lead,
  actions,
  variant = "default",
}: WorkspacePageHeaderProps) {
  const className =
    variant === "hero" ? "mjms-page-header mjms-page-header--hero" : "mjms-page-header";

  return (
    <header className={className}>
      <div className="mjms-page-header-main">
        {eyebrow && <p className="mjms-page-header-eyebrow">{eyebrow}</p>}
        <h1 className="mjms-page-header-title">{title}</h1>
        {lead && <p className="mjms-page-header-lead">{lead}</p>}
      </div>
      {actions && <div className="mjms-page-header-actions">{actions}</div>}
    </header>
  );
}
