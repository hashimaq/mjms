import type { CategoryDefinition, SeasonDefinition } from "@/lib/collections/config";
import { cn } from "@/lib/utils";

type CatalogueBoardProps = {
  season: SeasonDefinition;
  category: CategoryDefinition;
  className?: string;
};

/** Folder / catalogue-board accent — visual only. */
export function CatalogueBoard({ season, category, className }: CatalogueBoardProps) {
  return (
    <div className={cn("catalogue-board", `catalogue-board--${season.accent}`, className)} aria-hidden>
      <div className="catalogue-board-tab">
        <span>{season.shortTitle}</span>
        <span className="catalogue-board-tab-sep">/</span>
        <span>{category.label}</span>
      </div>
      <div className="catalogue-board-body">
        <span className="catalogue-board-line" />
        <span className="catalogue-board-corner catalogue-board-corner--tl" />
        <span className="catalogue-board-corner catalogue-board-corner--br" />
      </div>
    </div>
  );
}
