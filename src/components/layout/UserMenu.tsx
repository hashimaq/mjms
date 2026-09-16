"use client";

import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type UserMenuProps = {
  user: UserProfile;
  triggerClassName?: string;
};

export function UserMenu({ user, triggerClassName }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isDemo = user.id.startsWith("demo-");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (user.fullName || user.email)
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  async function logout() {
    if (isDemo) {
      await fetch("/api/auth/demo-logout", { method: "POST" });
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn("catalog-header-user-btn", triggerClassName)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="catalog-header-avatar">{initials || "U"}</span>
        <span className="hidden max-w-[140px] truncate text-left sm:block">
          {user.fullName || user.email}
        </span>
        <ChevronDown className="hidden h-4 w-4 opacity-60 sm:block" />
      </button>

      {open && (
        <div role="menu" className="catalog-user-menu">
          <div className="border-b border-border/80 px-3.5 py-3">
            <p className="truncate text-sm font-medium">{user.fullName || "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {user.role}
              {isDemo ? " · demo" : ""}
            </p>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5 md:hidden">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle className="catalog-header-icon-btn" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start gap-2"
            onClick={logout}
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}
