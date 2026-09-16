"use client";

import { useLoginGeometryMasks } from "@/hooks/useLoginGeometryMasks";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { LoginBrandPanel } from "./LoginBrandPanel";
import { LoginForm } from "./LoginForm";
import { LoginMobileDecor } from "./LoginMobileDecor";
import { LoginSplash } from "./LoginSplash";

const SPLASH_KEY = "mjms-splash-seen";

export function LoginPageClient() {
  const [phase, setPhase] = useState<"pending" | "splash" | "login">("pending");
  const shellRef = useRef<HTMLDivElement>(null);
  const masks = useLoginGeometryMasks(shellRef, phase === "login");

  useEffect(() => {
    setPhase(sessionStorage.getItem(SPLASH_KEY) === "1" ? "login" : "splash");
  }, []);

  const handleSplashComplete = useCallback(() => {
    setPhase("login");
  }, []);

  const showSplash = phase === "splash";
  const showLogin = phase === "login";

  const shellStyle = {
    "--login-shell-geometry-mask": masks.shell,
    "--login-brand-geometry-mask": masks.brand,
  } as CSSProperties;

  return (
    <>
      {showSplash && <LoginSplash onComplete={handleSplashComplete} />}
      <div
        ref={shellRef}
        className={`login-shell ${showLogin ? "login-shell--visible" : "login-shell--hidden"}`}
        style={shellStyle}
        aria-hidden={!showLogin}
      >
        <LoginMobileDecor />
        <LoginBrandPanel />

        <section className="login-auth">
          <div className="login-auth-toolbar">
            <ThemeToggle size="md" className="login-theme-toggle mjms-theme-toggle mjms-theme-toggle--md" />
          </div>

          <div className="login-auth-inner mjms-fade-in mjms-fade-in-delay">
            <LoginForm />
          </div>
        </section>
      </div>
    </>
  );
}
