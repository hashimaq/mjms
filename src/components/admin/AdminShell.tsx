"use client";

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import type { WorkspaceNavSection } from "@/components/workspace/WorkspaceNav";
import type { UserProfile } from "@/lib/projects/types";
import { Activity, FolderOpen, LayoutDashboard, PlusCircle, Search, Users } from "lucide-react";
import type { ReactNode } from "react";

const NAV_SECTIONS: WorkspaceNavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/catalogue", label: "Catalogue", icon: FolderOpen },
      { href: "/admin/search", label: "Search", icon: Search },
      { href: "/admin/products/new", label: "Add product", icon: PlusCircle },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/admin/employees", label: "Employees", icon: Users },
      { href: "/admin/activity", label: "Activity", icon: Activity },
    ],
  },
];

type AdminShellProps = {
  user: UserProfile;
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <WorkspaceShell
      user={user}
      variant="admin"
      navSections={NAV_SECTIONS}
      brandHref="/admin/dashboard"
      searchHref="/admin/search"
    >
      {children}
    </WorkspaceShell>
  );
}
