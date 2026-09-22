import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { profileDisplayName } from "@/lib/auth/display-name";

type AdminDashboardHeaderProps = {
  fullName: string | null;
};

export function AdminDashboardHeader({ fullName }: AdminDashboardHeaderProps) {
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
            Catalogue, team activity, and product development — admin overview.
          </p>
        </div>
        <span className="mjms-role-badge mjms-role-badge--admin">Admin</span>
      </div>
    </header>
  );
}
