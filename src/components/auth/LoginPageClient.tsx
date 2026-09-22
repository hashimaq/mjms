"use client";

import { useLoginGeometryMasks } from "@/hooks/useLoginGeometryMasks";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useRef, type CSSProperties } from "react";
import { LoginBrandPanel } from "./LoginBrandPanel";
import { LoginForm } from "./LoginForm";
import { LoginMobileDecor } from "./LoginMobileDecor";

export function LoginPageClient() {
  const shellRef = useRef<HTMLDivElement>(null);
  const masks = useLoginGeometryMasks(shellRef, true);

  const shellStyle = {
    "--login-shell-geometry-mask": masks.shell,
    "--login-brand-geometry-mask": masks.brand,
  } as CSSProperties;

  return (
    <div
      ref={shellRef}
      className="login-shell login-shell--visible"
      style={shellStyle}
    >
      <LoginMobileDecor />
      <LoginBrandPanel />

      <section className="login-auth" aria-label="Sign in">
        <div className="login-auth-toolbar">
          <ThemeToggle size="md" className="login-theme-toggle mjms-theme-toggle mjms-theme-toggle--md" />
        </div>

        <div className="login-auth-inner">
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
