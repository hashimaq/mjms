import Link from "next/link";

export const metadata = {
  title: "Winter Collection | MJMS Product Development",
  description: "Winter footwear collection — catalogue coming soon.",
};

export default function WinterCollectionPage() {
  return (
    <article className="collection-stub">
      <p className="collection-stub-eyebrow">Collection</p>
      <h1 className="collection-stub-title">Winter Collection</h1>
      <p className="collection-stub-body">
        Category and product browsing for the Winter line will be available in an upcoming
        release. This page confirms navigation from the homepage.
      </p>
      <div className="collection-stub-actions">
        <Link href="/#collections" className="mjms-btn mjms-btn-secondary mjms-btn-md">
          All collections
        </Link>
        <Link href="/" className="mjms-btn mjms-btn-ghost mjms-btn-md">
          Homepage
        </Link>
      </div>
    </article>
  );
}
