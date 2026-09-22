"use client";

import { Search } from "lucide-react";
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
            <div className="home-catalogue-search-field">
              <Search className="home-catalogue-search-icon" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products or projects..."
                aria-label="Search products or projects"
                className="home-catalogue-search-input"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="mjms-btn mjms-btn-primary mjms-btn-md">
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
