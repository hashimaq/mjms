"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./Button";

type ThemeToggleSize = "sm" | "md";

type ThemeToggleProps = {
  className?: string;
  size?: ThemeToggleSize;
};

const iconClass: Record<ThemeToggleSize, string> = {
  sm: "h-4 w-4",
  md: "h-[1.25rem] w-[1.25rem]",
};

const buttonClass: Record<ThemeToggleSize, string> = {
  sm: "mjms-theme-toggle mjms-theme-toggle--sm",
  md: "mjms-theme-toggle mjms-theme-toggle--md",
};

export function ThemeToggle({ className, size = "sm" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonClass[size], className)}
        aria-label="Theme"
      >
        <Sun className={iconClass[size]} strokeWidth={2} aria-hidden />
      </Button>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(buttonClass[size], className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className={iconClass[size]} strokeWidth={2} aria-hidden />
      ) : (
        <Moon className={iconClass[size]} strokeWidth={2} aria-hidden />
      )}
    </Button>
  );
}
