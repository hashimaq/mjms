import type { UserProfile } from "@/lib/projects/types";

/** Canonical app roles (DB may store `staff` or `employee` for operators). */
export type AppRole = UserProfile["role"];

const EMPLOYEE_DB_ROLES = new Set(["staff", "employee"]);

export function normalizeProfileRole(raw: string | null | undefined): AppRole | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "admin") return "admin";
  if (EMPLOYEE_DB_ROLES.has(value)) return "staff";
  return null;
}

export function isAdminRole(role: AppRole | null | undefined): boolean {
  return role === "admin";
}

export function isEmployeeRole(role: AppRole | null | undefined): boolean {
  return role === "staff";
}

/** Human-readable label — never show raw `staff` in UI. */
export function roleDisplayLabel(role: AppRole): string {
  return role === "admin" ? "Admin" : "Employee";
}

export function roleHomePath(role: AppRole): string {
  return role === "admin" ? "/admin/dashboard" : "/employee/dashboard";
}

export function adminDashboardPath(): string {
  return "/admin/dashboard";
}

export function employeeDashboardPath(): string {
  return "/employee/dashboard";
}
