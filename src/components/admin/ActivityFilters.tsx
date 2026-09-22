"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "CREATE_PRODUCT", label: "Created product" },
  { value: "UPDATE_PRODUCT", label: "Updated product" },
  { value: "UPLOAD_PHOTO", label: "Uploaded photo" },
  { value: "SET_PRIMARY_PHOTO", label: "Set primary photo" },
  { value: "DELETE_PRODUCT", label: "Deleted product" },
];

type ActivityFiltersProps = {
  employees: { id: string; name: string }[];
};

export function ActivityFilters({ employees }: ActivityFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const action = params.get("action") ?? "";
  const userId = params.get("user") ?? "";

  function apply(next: { action?: string; user?: string }) {
    const sp = new URLSearchParams();
    const nextAction = next.action ?? action;
    const nextUser = next.user ?? userId;
    if (nextAction) sp.set("action", nextAction);
    if (nextUser) sp.set("user", nextUser);
    startTransition(() => {
      const qs = sp.toString();
      router.push(qs ? `/admin/activity?${qs}` : "/admin/activity");
    });
  }

  return (
    <form className="mjms-activity-filters" aria-label="Filter activity">
      <label className="mjms-activity-filter">
        <span className="mjms-activity-filter-label">Employee</span>
        <select
          className="catalogue-product-form-input mjms-activity-filter-select"
          value={userId}
          disabled={pending}
          onChange={(e) => apply({ user: e.target.value })}
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mjms-activity-filter">
        <span className="mjms-activity-filter-label">Action</span>
        <select
          className="catalogue-product-form-input mjms-activity-filter-select"
          value={action}
          disabled={pending}
          onChange={(e) => apply({ action: e.target.value })}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
