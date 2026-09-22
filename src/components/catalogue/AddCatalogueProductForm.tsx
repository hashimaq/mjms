"use client";

import { Button } from "@/components/ui/Button";
import { CATEGORIES, SEASON_SLUGS, SEASONS } from "@/lib/collections/config";
import { createCatalogueProduct, type CreateCatalogueProductInput } from "@/lib/catalogue/actions";
import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddCatalogueProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCatalogueProductInput>({
    projectName: "",
    season: "winter",
    category: "heel",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createCatalogueProduct(form);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/products/${result.articleId}`);
    router.refresh();
  }

  return (
    <form className="catalogue-product-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <section className="catalogue-product-form-section">
        <h2 className="catalogue-product-form-heading">Basic information</h2>
        <div className="catalogue-product-form-grid">
          <Field label="Project name" required>
            <input
              className="catalogue-product-form-input"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              required
            />
          </Field>
          <Field label="Article / reference">
            <input
              className="catalogue-product-form-input"
              value={form.articleReference ?? ""}
              onChange={(e) => setForm({ ...form, articleReference: e.target.value })}
            />
          </Field>
          <Field label="Season" required>
            <select
              className="catalogue-product-form-input"
              value={form.season}
              onChange={(e) => setForm({ ...form, season: e.target.value as SeasonSlug })}
            >
              {SEASON_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {SEASONS[s].title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" required>
            <select
              className="catalogue-product-form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as CategorySlug })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Making">
            <input
              className="catalogue-product-form-input"
              value={form.making ?? ""}
              onChange={(e) => setForm({ ...form, making: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <input
              className="catalogue-product-form-input"
              value={form.type ?? ""}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="catalogue-product-form-section">
        <h2 className="catalogue-product-form-heading">Product information</h2>
        <div className="catalogue-product-form-grid">
          <Field label="Material">
            <input
              className="catalogue-product-form-input"
              value={form.material ?? ""}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
            />
          </Field>
          <Field label="Colour">
            <input
              className="catalogue-product-form-input"
              value={form.colour ?? ""}
              onChange={(e) => setForm({ ...form, colour: e.target.value })}
            />
          </Field>
          <Field label="Size range">
            <input
              className="catalogue-product-form-input"
              value={form.sizeRange ?? ""}
              onChange={(e) => setForm({ ...form, sizeRange: e.target.value })}
            />
          </Field>
          <Field label="Quantity">
            <input
              className="catalogue-product-form-input"
              value={form.qty ?? ""}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Remarks">
          <textarea
            className="catalogue-product-form-textarea"
            rows={3}
            value={form.remarks ?? ""}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </Field>
      </section>

      {error && (
        <p className="catalogue-product-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="catalogue-product-form-actions">
        <Button type="submit" variant="primary" loading={loading}>
          Create product
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="catalogue-product-form-field">
      <span className="catalogue-product-form-label">
        {label}
        {required && <span className="catalogue-product-form-required"> *</span>}
      </span>
      {children}
    </label>
  );
}
