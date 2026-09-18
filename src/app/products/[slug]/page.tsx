import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Product — ${slug.slice(0, 8)}… | MJMS Product Development`,
    description: "Product detail — full gallery and specifications coming in a later release.",
  };
}

/** Day 6 placeholder — cards link here with article id as slug. */
export default async function ProductDetailPlaceholderPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug?.trim()) notFound();

  return (
    <div className="home-page collection-layout min-h-dvh">
      <main className="collection-main">
        <article className="collection-page">
          <div className="collection-page-inner home-container">
            <p className="collection-page-eyebrow">Product</p>
            <h1 className="collection-page-title">Product detail</h1>
            <p className="collection-page-lead">
              Full product gallery, specifications, and development notes will be available in Day 6.
              The catalogue link architecture is in place for this record.
            </p>
            <div className="collection-page-back">
              <Link href="/#collections" className="mjms-btn mjms-btn-primary mjms-btn-md">
                Browse collections
              </Link>
              <Link href="/projects" className="mjms-btn mjms-btn-secondary mjms-btn-md">
                Employee projects
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
