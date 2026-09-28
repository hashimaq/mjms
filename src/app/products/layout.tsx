import { PublicCatalogueChrome } from "@/components/layout/PublicCatalogueChrome";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicCatalogueChrome>
      <div className="product-detail-main">{children}</div>
    </PublicCatalogueChrome>
  );
}
