import type { ReactNode } from "react";

export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return <div className="auth-welcome-root">{children}</div>;
}
