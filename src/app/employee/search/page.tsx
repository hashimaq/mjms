import { CatalogueSearchSection } from "@/components/catalogue/CatalogueSearchSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search catalogue | Employee | MJMS",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmployeeSearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;

  return (
    <CatalogueSearchSection
      basePath="/employee/search"
      searchParams={raw}
      heading="Search catalogue"
      lead="Find development records by project name, article reference, or filters."
      searchNavigatePath="/employee/search"
    />
  );
}
