import { FolderOpen, PlusCircle, Search, Clock } from "lucide-react";
import Link from "next/link";

const LINKS = [
  {
    href: "/employee/catalogue",
    title: "Catalogue",
    lead: "Browse seasons and category folders.",
    icon: FolderOpen,
  },
  {
    href: "/employee/search",
    title: "Search",
    lead: "Find projects and articles quickly.",
    icon: Search,
  },
  {
    href: "/employee/products/new",
    title: "Add product",
    lead: "Create a record with photos.",
    icon: PlusCircle,
  },
  {
    href: "/employee/activity",
    title: "My activity",
    lead: "Your recent catalogue actions.",
    icon: Clock,
  },
] as const;

export function EmployeeDashboardQuickLinks() {
  return (
    <section className="mjms-workspace-actions" aria-labelledby="employee-workspace-heading">
      <h2 id="employee-workspace-heading" className="mjms-section-title">
        Workspace
      </h2>
      <div className="mjms-workspace-actions-grid">
        {LINKS.map(({ href, title, lead, icon: Icon }) => (
          <Link key={href} href={href} className="mjms-workspace-action-card" prefetch>
            <Icon className="mjms-workspace-action-icon" aria-hidden />
            <span className="mjms-workspace-action-title">{title}</span>
            <span className="mjms-workspace-action-lead">{lead}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
