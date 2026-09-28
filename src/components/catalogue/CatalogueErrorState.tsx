import { BrandedStatePanel } from "@/components/brand/BrandedStatePanel";
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
    <BrandedStatePanel title="Something went wrong" sketch="stiletto" role="alert">
      <p className="catalogue-error-text">{message}</p>
      <div className="catalogue-error-actions">
        <Link href={retryHref} className="mjms-btn mjms-btn-primary mjms-btn-md">
          Try again
        </Link>
        <Link href="/" className="mjms-btn mjms-btn-ghost mjms-btn-md">
          Homepage
        </Link>
      </div>
    </BrandedStatePanel>
  );
}
