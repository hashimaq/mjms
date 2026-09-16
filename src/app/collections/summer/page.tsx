import Link from "next/link";

export const metadata = {
  title: "Summer Collection | MJMS Product Development",
  description: "Summer footwear collection — catalogue coming soon.",
};

export default function SummerCollectionPage() {
  return (
    <article className="collection-stub">
      <p className="collection-stub-eyebrow">Collection</p>
      <h1 className="collection-stub-title">Summer Collection</h1>
      <p className="collection-stub-body">
        Category and product browsing for the Summer line will be available in an upcoming
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
