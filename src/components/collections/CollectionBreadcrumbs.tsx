import { cn } from "@/lib/utils";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type CollectionBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function CollectionBreadcrumbs({ items, className }: CollectionBreadcrumbsProps) {
  return (
    <nav className={cn("collection-breadcrumbs", className)} aria-label="Breadcrumb">
      <ol className="collection-breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="collection-breadcrumbs-item">
              {isLast || !item.href ? (
                <span className="collection-breadcrumbs-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="collection-breadcrumbs-link">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
