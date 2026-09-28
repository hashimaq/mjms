import { MjmsBrandAtmosphere } from "@/components/brand/MjmsBrandAtmosphere";
import { Suspense } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="login-layout-root login-layout-root--branded mjms-public-brand mjms-auth-layout">
      <MjmsBrandAtmosphere tone="auth" />
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
