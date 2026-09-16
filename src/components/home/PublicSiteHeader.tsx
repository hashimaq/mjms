"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

export function PublicSiteHeader() {
  return (
    <header className="home-header">
      <div className="home-header-inner">
        <Link href="/" className="home-header-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mjms-logo.jpg"
            alt="MJMS"
            width={160}
            height={46}
            className="home-header-logo"
            decoding="async"
          />
          <span className="home-header-label">MJMS Product Development</span>
        </Link>

        <nav className="home-header-nav" aria-label="Main">
          <Link href="/#collections" className="home-header-nav-link">
            Collections
          </Link>
          <Link href="/#about" className="home-header-nav-link">
            About
          </Link>
          <ThemeToggle size="md" className="home-header-theme" />
          <Link href="/login" className="mjms-btn mjms-btn-secondary mjms-btn-sm home-header-login">
            Employee Login
          </Link>
        </nav>
      </div>
      <div className="home-header-stripe" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
    </header>
  );
}
