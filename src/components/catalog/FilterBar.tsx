import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductFilter } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  filters: ProductFilter[];
  active: string;
  onChange: (id: string) => void;
};

export function FilterBar({ filters, active, onChange }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [filters]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canLeft && (
        <button
          type="button"
          aria-label="Desplazar a la izquierda"
          onClick={() => scrollBy(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/90 border border-border shadow-sm text-foreground hover:bg-accent hover:text-accent-foreground transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
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

      {canRight && (
        <button
          type="button"
          aria-label="Desplazar a la derecha"
          onClick={() => scrollBy(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/90 border border-border shadow-sm text-foreground hover:bg-accent hover:text-accent-foreground transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
