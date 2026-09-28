"use client";

import { CatalogueErrorState } from "@/components/catalogue/CatalogueErrorState";
import { CollectionPageDecor } from "@/components/collections/CollectionPageDecor";
import { usePathname } from "next/navigation";

export default function CategoryCatalogueError() {
  const pathname = usePathname();
  return (
    <article className="collection-page collection-page--category collection-page--catalogue">
      <CollectionPageDecor season="neutral" />
      <div className="collection-page-inner home-container">
        <CatalogueErrorState retryHref={pathname ?? "/"} />
      </div>
    </article>
  );
}
