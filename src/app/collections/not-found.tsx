import Link from "next/link";

export default function CollectionNotFound() {
  return (
    <article className="collection-page">
      <div className="collection-page-inner home-container">
        <header className="collection-page-header">
          <p className="collection-page-eyebrow">Collection</p>
          <h1 className="collection-page-title">Page not found</h1>
          <p className="collection-page-lead">
            This collection or category does not exist. Choose Winter or Summer from the homepage.
          </p>
        </header>
        <div className="collection-page-back">
          <Link href="/#collections" className="mjms-btn mjms-btn-primary mjms-btn-md">
            View collections
          </Link>
          <Link href="/" className="mjms-btn mjms-btn-ghost mjms-btn-md">
            Homepage
          </Link>
        </div>
      </div>
    </article>
  );
}
