import { HomePageAtmosphere } from "@/components/home/HomeBackdrop";
import { HomeMarquee } from "@/components/home/HomeMarquee";
import { PublicSiteHeader } from "@/components/home/PublicSiteHeader";
import Link from "next/link";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-page collection-layout">
      <HomePageAtmosphere />
      <PublicSiteHeader />
      <HomeMarquee variant="strip" />
      <main className="collection-main">{children}</main>
      <HomeMarquee variant="footer" />
      <footer className="home-footer">
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
