import { MjmsBrandAtmosphere } from "@/components/brand/MjmsBrandAtmosphere";
import type { ReactNode } from "react";

export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-welcome-root mjms-public-brand mjms-auth-layout">
      <MjmsBrandAtmosphere tone="auth" />
      {children}
    </div>
  );
}
