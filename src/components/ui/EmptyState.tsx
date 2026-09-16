import { BrandGeometry } from "@/components/brand/BrandGeometry";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("mjms-empty", className)}>
      <BrandGeometry variant="empty" />
      {Icon && (
        <div className="mjms-empty-icon">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      )}
      <h3 className="mjms-empty-title">{title}</h3>
      {description && <p className="mjms-empty-description">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
