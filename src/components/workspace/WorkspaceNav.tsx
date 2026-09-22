"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type WorkspaceNavSection = {
  title: string;
  items: WorkspaceNavItem[];
};

type WorkspaceNavProps = {
  sections: WorkspaceNavSection[];
  footer?: React.ReactNode;
  onNavigate?: () => void;
};

export function WorkspaceNav({ sections, footer, onNavigate }: WorkspaceNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mjms-workspace-nav" aria-label="Workspace">
      {sections.map((section) => (
        <div key={section.title} className="mjms-workspace-nav-section">
          <p className="mjms-workspace-nav-section-title">{section.title}</p>
          <ul className="mjms-workspace-nav-list">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                onClick={onNavigate}
                className={cn(
                  "mjms-workspace-nav-link",
                  active && "mjms-workspace-nav-link--active"
                )}
              >
                    <Icon className="mjms-workspace-nav-icon" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {footer && <div className="mjms-workspace-nav-foot">{footer}</div>}
    </nav>
  );
}
