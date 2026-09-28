import { BrandedStatePanel } from "@/components/brand/BrandedStatePanel";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import Link from "next/link";

export default function CollectionNotFound() {
  return (
    <article className="collection-page">
      <CollectionPageDecor season="neutral" />
      <div className="collection-page-inner home-container">
        <header className="collection-page-header">
          <p className="collection-page-eyebrow">Collection</p>
        </header>
        <BrandedStatePanel title="Page not found" sketch="handbag">
          <p className="collection-page-lead">
            This collection or category does not exist. Choose Winter or Summer from the homepage.
          </p>
          <div className="collection-page-back">
            <Link href="/#collections" className="mjms-btn mjms-btn-primary mjms-btn-md">
              View collections
            </Link>
            <Link href="/" className="mjms-btn mjms-btn-ghost mjms-btn-md">
              Homepage
            </Link>
          </div>
        </BrandedStatePanel>
      </div>
    </article>
  );
}
