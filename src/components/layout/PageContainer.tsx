import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  /** Slightly narrower reading width for detail views */
  narrow?: boolean;
};

export function PageContainer({ children, className, narrow }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow ? "max-w-6xl" : "max-w-[1240px]",
        className
      )}
    >
      {children}
    </div>
  );
}
