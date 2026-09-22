import { profileDisplayName } from "@/lib/auth/display-name";

type DashboardGreetingProps = {
  fullName: string | null;
  subtitle?: string;
};

export function DashboardGreeting({
  fullName,
  subtitle = "Here's what's happening across MJMS Product Development.",
}: DashboardGreetingProps) {
  const name = profileDisplayName(fullName);

  return (
    <header className="mjms-dashboard-greeting">
      <p className="mjms-dashboard-greeting-eyebrow">MJMS Product Development</p>
      <h1 className="mjms-dashboard-greeting-title">
        {name ? `Welcome back, ${name}` : "Welcome back"}
      </h1>
      <p className="mjms-dashboard-greeting-lead">{subtitle}</p>
    </header>
  );
}
