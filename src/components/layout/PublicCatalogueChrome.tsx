import type { CollectionSeasonAccent } from "@/components/brand/fashion-silhouette-registry";
import { MjmsBrandAtmosphere } from "@/components/brand/MjmsBrandAtmosphere";
import { HomeFashionMarquee } from "@/components/home/HomeFashionMarquee";
import { HomeMarquee } from "@/components/home/HomeMarquee";
import { PublicSiteHeader } from "@/components/home/PublicSiteHeader";
import Link from "next/link";
import type { ReactNode } from "react";

type PublicCatalogueChromeProps = {
  children: ReactNode;
  season?: CollectionSeasonAccent;
};

/** One public catalogue shell — collections, search, product detail routes. */
export function PublicCatalogueChrome({ children, season = "neutral" }: PublicCatalogueChromeProps) {
  return (
    <div className="home-page collection-layout mjms-public-brand">
      <MjmsBrandAtmosphere tone="catalogue" season={season} />
      <PublicSiteHeader />
      <HomeMarquee variant="strip" />
      <HomeFashionMarquee />
      <main className="collection-main">{children}</main>
      <HomeMarquee variant="footer" />
      <footer className="home-footer home-below-fold">
        <div className="home-container">
          <p className="home-footer-text">
            <Link href="/" className="home-footer-link">
              Back to homepage
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
