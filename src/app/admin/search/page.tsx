import { CatalogueSearchSection } from "@/components/catalogue/CatalogueSearchSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search catalogue | Admin | MJMS",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;

  return (
    <CatalogueSearchSection
      basePath="/admin/search"
      searchParams={raw}
      heading="Search catalogue"
      lead="Find products by project name, article reference, or filters."
      searchNavigatePath="/admin/search"
    />
  );
}
