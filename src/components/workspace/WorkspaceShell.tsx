"use client";

import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { MjmsLogo } from "@/components/brand/MjmsLogo";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { profileDisplayName } from "@/lib/auth/display-name";
import { roleDisplayLabel } from "@/lib/auth/roles";
import type { UserProfile } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { LogOut, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { WorkspaceNav, type WorkspaceNavSection } from "./WorkspaceNav";

type WorkspaceShellProps = {
  user: UserProfile;
  variant: "admin" | "employee";
  navSections: WorkspaceNavSection[];
  brandHref: string;
  searchHref: string;
  children: ReactNode;
};

export function WorkspaceShell({
  user,
  variant,
  navSections,
  brandHref,
  searchHref,
  children,
}: WorkspaceShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const displayName = profileDisplayName(user.fullName) ?? user.email;
  const roleLabel = roleDisplayLabel(user.role);

  async function logout() {
    const isDemo = user.id.startsWith("demo-");
    if (isDemo) {
      await fetch("/api/auth/demo-logout", { method: "POST" });
    } else {
      const { createClient } = await import("@/lib/supabase/client");
      await createClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={cn("mjms-workspace", `mjms-workspace--${variant}`)}>
      <aside
        className={cn("mjms-workspace-aside", mobileOpen && "mjms-workspace-aside--open")}
        aria-label={`${variant === "admin" ? "Admin" : "Employee"} navigation`}
      >
        <div className="mjms-workspace-aside-head">
          <Link href={brandHref} className="mjms-workspace-brand">
            <MjmsLogo height={32} className="mjms-workspace-logo" priority />
            <span className="mjms-workspace-brand-text">Product Development</span>
          </Link>
          <button
            type="button"
            className="mjms-workspace-mobile-close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <WorkspaceNav
          sections={navSections}
          onNavigate={() => setMobileOpen(false)}
          footer={
            <div className="mjms-workspace-aside-foot">
              <p className="mjms-workspace-nav-section-title">Account</p>
              <Link href="/" className="mjms-workspace-foot-link" target="_blank" rel="noopener noreferrer">
                View public site
              </Link>
              <button type="button" className="mjms-workspace-logout" onClick={() => void logout()}>
                <LogOut className="h-4 w-4" aria-hidden />
                Logout
              </button>
            </div>
          }
        />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="mjms-workspace-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="mjms-workspace-main">
        <BrandGeometry variant="login" className="mjms-workspace-geometry" />
        <header className="mjms-workspace-topbar">
          <div className="mjms-workspace-topbar-start">
            <button
              type="button"
              className="mjms-workspace-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="mjms-workspace-identity">
              <p className="mjms-workspace-identity-name">{displayName}</p>
              <p className="mjms-workspace-identity-role">{roleLabel}</p>
            </div>
          </div>
          <div className="mjms-workspace-topbar-actions">
            <Link href={searchHref} className="mjms-workspace-search-btn">
              <Search className="h-4 w-4" aria-hidden />
              <span>Search catalogue</span>
            </Link>
            <ThemeToggle size="md" className="mjms-workspace-theme" />
            <UserMenu user={user} triggerClassName="mjms-workspace-user" />
          </div>
        </header>
        <div className="mjms-workspace-content">{children}</div>
      </div>
    </div>
  );
}
