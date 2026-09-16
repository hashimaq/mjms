import { Suspense } from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="login-layout-root login-layout-root--branded">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
