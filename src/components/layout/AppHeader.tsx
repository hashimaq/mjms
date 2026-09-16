"use client";

import { MjmsLogo } from "@/components/brand/MjmsLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PageContainer } from "@/components/layout/PageContainer";
import type { UserProfile } from "@/lib/projects/types";
import Link from "next/link";
import { UserMenu } from "./UserMenu";

type AppHeaderProps = {
  user: UserProfile;
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="catalog-header sticky top-0 z-40">
      <PageContainer>
        <div className="catalog-header-inner">
          <Link
            href="/projects"
            className="catalog-header-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <MjmsLogo priority className="catalog-header-logo shrink-0" />
            <div className="catalog-header-brand-text min-w-0">
              <p className="catalog-header-title truncate">MJMS Product Development</p>
              <p className="catalog-header-subtitle hidden truncate md:block">
                Product Development &amp; Project Hub
              </p>
            </div>
          </Link>

          <div className="catalog-header-actions">
            <ThemeToggle className="catalog-header-icon-btn" />
            <UserMenu user={user} />
          </div>
        </div>
      </PageContainer>
      <div className="catalog-header-stripe" aria-hidden>
        <span className="catalog-header-stripe-segment" />
        <span className="catalog-header-stripe-segment" />
        <span className="catalog-header-stripe-segment" />
        <span className="catalog-header-stripe-segment" />
      </div>
    </header>
  );
}
