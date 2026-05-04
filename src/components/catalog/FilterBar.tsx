import type { ProductFilter } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  filters: ProductFilter[];
  active: string;
  onChange: (id: string) => void;
};

export function FilterBar({ filters, active, onChange }: Props) {
  return (
    <div className="relative">
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
        role="tablist"
        aria-label="Filtros de categoría"
      >
        {filters.map((f) => {
          const isOffer = f.id === "ofertas";
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive}
              onClick={() => onChange(f.id)}
              className={cn("filter-pill", isOffer && "is-offer")}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}
