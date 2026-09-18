import Link from "next/link";

type CatalogueErrorStateProps = {
  message?: string;
  retryHref: string;
};

export function CatalogueErrorState({
  message = "We could not load this catalogue category.",
  retryHref,
}: CatalogueErrorStateProps) {
  return (
    <div className="catalogue-error-state" role="alert">
      <h2 className="catalogue-error-title">Something went wrong</h2>
      <p className="catalogue-error-text">{message}</p>
      <div className="catalogue-error-actions">
        <Link href={retryHref} className="mjms-btn mjms-btn-primary mjms-btn-md">
          Try again
        </Link>
        <Link href="/" className="mjms-btn mjms-btn-ghost mjms-btn-md">
          Homepage
        </Link>
      </div>
    </div>
  );
}
