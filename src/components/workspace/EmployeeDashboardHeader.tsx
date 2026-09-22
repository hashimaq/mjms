import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { profileDisplayName } from "@/lib/auth/display-name";

type EmployeeDashboardHeaderProps = {
  fullName: string | null;
};

export function EmployeeDashboardHeader({ fullName }: EmployeeDashboardHeaderProps) {
  const name = profileDisplayName(fullName);

  return (
    <header className="mjms-dashboard-hero">
      <BrandGeometry variant="login" className="mjms-dashboard-hero-geometry" />
      <div className="mjms-dashboard-hero-inner mjms-dashboard-greeting-row">
        <div>
          <p className="mjms-dashboard-greeting-eyebrow">MJMS Product Development</p>
          <h1 className="mjms-dashboard-greeting-title">
            {name ? `Welcome back, ${name}` : "Welcome back"}
          </h1>
          <p className="mjms-dashboard-greeting-lead">
            Your product development workspace — catalogue, search, and new projects.
          </p>
        </div>
        <span className="mjms-role-badge mjms-role-badge--employee">Employee</span>
      </div>
    </header>
  );
}
