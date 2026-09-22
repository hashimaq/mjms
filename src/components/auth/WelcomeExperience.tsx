"use client";

import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { MjmsLogo } from "@/components/brand/MjmsLogo";
import { Button } from "@/components/ui/Button";
import { welcomeHeading } from "@/lib/auth/display-name";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type WelcomeExperienceProps = {
  fullName: string | null;
  destination: string;
};

export function WelcomeExperience({ fullName, destination }: WelcomeExperienceProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"enter" | "ready">("enter");
  const heading = welcomeHeading(fullName);

  const continueToWorkspace = useCallback(() => {
    router.replace(destination);
    router.refresh();
  }, [destination, router]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("ready");
      return;
    }

    const enterTimer = window.setTimeout(() => setPhase("ready"), 480);
    const autoTimer = window.setTimeout(() => continueToWorkspace(), 2400);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(autoTimer);
    };
  }, [continueToWorkspace]);

  return (
    <div className={`auth-welcome auth-welcome--${phase}`}>
      <BrandGeometry variant="login" />
      <div className="auth-welcome-inner">
        <MjmsLogo priority className="auth-welcome-logo" />
        <p className="auth-welcome-eyebrow">MJMS Product Development</p>
        <h1 className="auth-welcome-title">{heading}</h1>
        <p className="auth-welcome-lead">Your product development workspace is ready.</p>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="auth-welcome-continue"
          onClick={continueToWorkspace}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
