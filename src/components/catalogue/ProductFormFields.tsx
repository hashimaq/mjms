"use client";

import { CATEGORIES, SEASON_SLUGS, SEASONS } from "@/lib/collections/config";
import type { CategorySlug, SeasonSlug } from "@/lib/collections/config";
import type { CreateCatalogueProductInput } from "@/lib/catalogue/actions";

export type ProductFormState = CreateCatalogueProductInput;

type ProductFormFieldsProps = {
  form: ProductFormState;
  onChange: (next: ProductFormState) => void;
  step: 0 | 1;
};

export function ProductFormFields({ form, onChange, step }: ProductFormFieldsProps) {
  if (step === 0) {
    return (
      <section className="catalogue-product-form-section">
        <h2 className="catalogue-product-form-heading">Basic information</h2>
        <div className="catalogue-product-form-grid">
          <Field label="Project name" required>
            <input
              className="catalogue-product-form-input"
              value={form.projectName}
              onChange={(e) => onChange({ ...form, projectName: e.target.value })}
              required
            />
          </Field>
          <Field label="Article / reference">
            <input
              className="catalogue-product-form-input"
              value={form.articleReference ?? ""}
              onChange={(e) => onChange({ ...form, articleReference: e.target.value })}
            />
          </Field>
          <Field label="Season" required>
            <select
              className="catalogue-product-form-input"
              value={form.season}
              onChange={(e) => onChange({ ...form, season: e.target.value as SeasonSlug })}
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
              onChange={(e) => onChange({ ...form, category: e.target.value as CategorySlug })}
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
              onChange={(e) => onChange({ ...form, making: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <input
              className="catalogue-product-form-input"
              value={form.type ?? ""}
              onChange={(e) => onChange({ ...form, type: e.target.value })}
            />
          </Field>
        </div>
      </section>
    );
  }

  return (
    <section className="catalogue-product-form-section">
      <h2 className="catalogue-product-form-heading">Product information</h2>
      <div className="catalogue-product-form-grid">
        <Field label="Material">
          <input
            className="catalogue-product-form-input"
            value={form.material ?? ""}
            onChange={(e) => onChange({ ...form, material: e.target.value })}
          />
        </Field>
        <Field label="Colour">
          <input
            className="catalogue-product-form-input"
            value={form.colour ?? ""}
            onChange={(e) => onChange({ ...form, colour: e.target.value })}
          />
        </Field>
        <Field label="Size range">
          <input
            className="catalogue-product-form-input"
            value={form.sizeRange ?? ""}
            onChange={(e) => onChange({ ...form, sizeRange: e.target.value })}
          />
        </Field>
        <Field label="Quantity">
          <input
            className="catalogue-product-form-input"
            value={form.qty ?? ""}
            onChange={(e) => onChange({ ...form, qty: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Remarks">
        <textarea
          className="catalogue-product-form-textarea"
          rows={3}
          value={form.remarks ?? ""}
          onChange={(e) => onChange({ ...form, remarks: e.target.value })}
        />
      </Field>
    </section>
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
