"use client";

import { CatalogueSearchInput } from "@/components/catalogue/search/CatalogueSearchInput";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeCatalogueSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <section className="home-catalogue-search" aria-labelledby="home-catalogue-search-heading">
      <div className="home-container">
        <div className="home-catalogue-search-inner">
          <div className="home-catalogue-search-geo" aria-hidden />
          <header className="home-catalogue-search-head">
            <p className="home-catalogue-search-eyebrow">Catalogue</p>
            <h2 id="home-catalogue-search-heading" className="home-catalogue-search-title">
              Find a product
            </h2>
            <p className="home-catalogue-search-subtitle">
              Search by project name or article / reference
            </p>
            <p className="home-catalogue-search-help">
              Search the MJMS product development catalogue by project name or article reference.
            </p>
          </header>

          <form className="home-catalogue-search-form" onSubmit={onSubmit}>
            <CatalogueSearchInput
              value={q}
              onChange={setQ}
              inputClassName="home-catalogue-search-input"
              wrapClassName="home-catalogue-search-field"
              iconClassName="home-catalogue-search-icon"
              clearButtonClassName="catalogue-search-toolbar-clear home-catalogue-search-clear"
            />
            <button type="submit" className="mjms-btn mjms-btn-primary mjms-btn-md">
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
