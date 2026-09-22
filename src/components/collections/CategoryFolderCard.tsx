import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import { categoryPath } from "@/lib/collections/config";
import type { CategorySummary } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CategoryFolderCardProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  summary: CategorySummary;
};

function FolderCollageSlot({
  imageUrl,
  visualIndex,
}: {
  imageUrl: string | null;
  visualIndex: number;
}) {
  const refLabel = `REF ${String(visualIndex).padStart(2, "0")}`;

  return (
    <div className="category-folder-slot">
      <div className="category-folder-slot-frame">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 40vw, 180px"
            className="category-folder-slot-image"
          />
        ) : (
          <div className="category-folder-slot-placeholder" aria-hidden>
            <span className="category-folder-slot-grid" />
            <span className="category-folder-slot-mark">MJMS</span>
            <span className="category-folder-slot-ref">{refLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CategoryFolderCard({ season, category, summary }: CategoryFolderCardProps) {
  const showCount =
    summary.dataSource === "live" &&
    summary.productCount != null &&
    summary.productCount > 0;

  return (
    <Link
      href={categoryPath(season.slug, category.slug)}
      className={cn("category-folder-card", `category-folder-card--${season.accent}`)}
    >
      <div className="category-folder-tab" aria-hidden>
        <span className="category-folder-tab-season">{season.shortTitle}</span>
      </div>

      <div className="category-folder-collage" aria-hidden>
        {summary.previewSlots.map((slot) => (
          <FolderCollageSlot
            key={slot.visualIndex}
            imageUrl={slot.imageUrl}
            visualIndex={slot.visualIndex}
          />
        ))}
      </div>

      <div className="category-folder-body">
        <h3 className="category-folder-title">{category.label.toUpperCase()}</h3>
        <p className="category-folder-desc">{category.description}</p>
        {showCount && (
          <p className="category-folder-count">
            {summary.productCount!.toLocaleString()} catalogue reference
            {summary.productCount === 1 ? "" : "s"}
          </p>
        )}
        <span className="category-folder-action">
          Open folder
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
