"use client";

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import type { WorkspaceNavSection } from "@/components/workspace/WorkspaceNav";
import type { UserProfile } from "@/lib/projects/types";
import { Clock, FolderOpen, LayoutDashboard, PlusCircle, Search } from "lucide-react";
import type { ReactNode } from "react";

const NAV_SECTIONS: WorkspaceNavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/employee/activity", label: "My activity", icon: Clock },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/employee/catalogue", label: "Catalogue", icon: FolderOpen },
      { href: "/employee/search", label: "Search", icon: Search },
      { href: "/employee/products/new", label: "Add product", icon: PlusCircle },
    ],
  },
];

type EmployeeShellProps = {
  user: UserProfile;
  children: ReactNode;
};

export function EmployeeShell({ user, children }: EmployeeShellProps) {
  return (
    <WorkspaceShell
      user={user}
      variant="employee"
      navSections={NAV_SECTIONS}
      brandHref="/employee/dashboard"
      searchHref="/employee/search"
    >
      {children}
    </WorkspaceShell>
  );
}
