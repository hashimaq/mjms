import Link from "next/link";

import { MjmsBrandAtmosphere } from "@/components/brand/MjmsBrandAtmosphere";
import { HomeHeroBackdrop } from "./HomeBackdrop";
import { HomeFashionMarquee } from "./HomeFashionMarquee";
import { HomeMarquee } from "./HomeMarquee";

import { HomeCatalogueSearch } from "./HomeCatalogueSearch";
import { PublicSiteHeader } from "./PublicSiteHeader";



export function HomePageContent() {

  return (

    <div className="home-page mjms-public-brand">
      <MjmsBrandAtmosphere tone="home" />
      <PublicSiteHeader />



      <main id="main-content">

        <section className="home-hero-viewport" aria-labelledby="home-hero-title">

          <HomeHeroBackdrop />

          <HomeMarquee variant="hero" />



          <div className="home-container home-hero-stage">

            <div className="home-hero-inner">

              <div className="home-hero-brand">

                {/* eslint-disable-next-line @next/next/no-img-element */}

                <img

                  src="/brand/mjms-logo.jpg"

                  alt="MJMS"

                  width={480}

                  height={140}

                  className="home-hero-logo"

                  decoding="async"

                  fetchPriority="high"

                />

                <h1 id="home-hero-title" className="home-hero-title">

                  MJMS Product Development

                </h1>

              </div>



              <div className="home-hero-copy">

                <p className="home-hero-tagline">

                  Ladies footwear &amp; fashion product development — heels, flats, loafers,

                  bags, and seasonal collections.

                </p>

                <p className="home-hero-lead">

                  MJMS develops and documents ladies footwear and fashion products for

                  professional catalogue review — not retail shopping, but studio-quality

                  product development showcase.

                </p>

              </div>



              <div className="home-hero-collections" aria-label="Season collections">

                <Link

                  href="/collections/winter"

                  className="home-hero-collection-card home-hero-collection-card--winter"

                >

                  <span className="home-hero-collection-label">Winter Collection</span>

                  <span className="home-hero-collection-cta">Explore</span>

                </Link>

                <Link

                  href="/collections/summer"

                  className="home-hero-collection-card home-hero-collection-card--summer"

                >

                  <span className="home-hero-collection-label">Summer Collection</span>

                  <span className="home-hero-collection-cta">Explore</span>

                </Link>

              </div>



              <div className="home-hero-actions">

                <Link href="/login" className="mjms-btn mjms-btn-primary mjms-btn-md home-hero-cta">

                  Employee Login

                </Link>

              </div>

            </div>

          </div>

        </section>

        <HomeCatalogueSearch />

        <HomeFashionMarquee />

        <HomeMarquee variant="strip" />

        <section id="collections" className="home-collections" aria-labelledby="collections-heading">

          <div className="home-container">

            <header className="home-section-head">

              <h2 id="collections-heading" className="home-section-title">

                Season collections

              </h2>

              <p className="home-section-desc">

                Explore seasonal ladies footwear and fashion development — heels, flats, PU lines,

                and more — organized for product teams and customer catalogue review.

              </p>

            </header>



            <div className="home-collection-grid">

              <Link

                href="/collections/winter"

                className="home-collection-card home-collection-card--winter"

              >

                <div className="home-collection-card-geo" aria-hidden />

                <div className="home-collection-card-body">

                  <h3 className="home-collection-card-title">Winter Collection</h3>

                  <p className="home-collection-card-text">

                    Cold-weather styles, insulated builds, and seasonal development records.

                  </p>

                  <span className="home-collection-card-action">View collection →</span>

                </div>

              </Link>



              <Link

                href="/collections/summer"

                className="home-collection-card home-collection-card--summer"

              >

                <div className="home-collection-card-geo" aria-hidden />

                <div className="home-collection-card-body">

                  <h3 className="home-collection-card-title">Summer Collection</h3>

                  <p className="home-collection-card-text">

                    Lightweight silhouettes, breathable materials, and warm-season catalogue lines.

                  </p>

                  <span className="home-collection-card-action">View collection →</span>

                </div>

              </Link>

            </div>

          </div>

        </section>



        <section id="about" className="home-intro home-below-fold" aria-labelledby="about-heading">

          <div className="home-container home-intro-inner">

            <h2 id="about-heading" className="home-intro-title">

              Footwear &amp; fashion development, documented beautifully

            </h2>

            <p className="home-intro-text">

              From heel lines to flats, dip moulds to seasonal bags and apparel concepts — MJMS

              presents development work as a premium fashion catalogue for staff and customers,

              with fast search and structured product records.

            </p>

          </div>

        </section>

      </main>



      <HomeMarquee variant="footer" />



      <footer className="home-footer home-below-fold">

        <div className="home-container">

          <p className="home-footer-text">© MJMS Product Development</p>

        </div>

      </footer>

    </div>

  );

}


