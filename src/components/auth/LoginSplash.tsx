"use client";

import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { MjmsLogo } from "@/components/brand/MjmsLogo";
import { useEffect, useState } from "react";

const SPLASH_KEY = "mjms-splash-seen";
const MIN_MS = 1500;
const MAX_MS = 2200;

type LoginSplashProps = {
  onComplete: () => void;
};

export function LoginSplash({ onComplete }: LoginSplashProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY) === "1") {
      onComplete();
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 700 : 1800;

    const holdTimer = window.setTimeout(() => setPhase("hold"), reduced ? 150 : 400);
    const exitTimer = window.setTimeout(() => setPhase("exit"), duration - 350);
    const doneTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      onComplete();
    }, duration);

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`login-splash login-splash--${phase}`}
      role="presentation"
      aria-hidden
    >
      <BrandGeometry variant="login" />
      <div className="login-splash-hero">
        <MjmsLogo priority className="login-splash-logo" />
        <p className="login-splash-title">MJMS Product Development</p>
      </div>
    </div>
  );
}
