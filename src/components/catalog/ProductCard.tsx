import { memo } from "react";
import { Plus, Eye } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { formatCurrency, getListPrice, getSalePrice, isOutOfStock } from "@/lib/catalog";
import { ProductBadges } from "./ProductBadges";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  onOpen: (p: Product) => void;
  onAdd: (p: Product, sourceEl: HTMLElement) => void;
};

function ProductCardImpl({ product: p, onOpen, onAdd }: Props) {
  const out = isOutOfStock(p);
  const list = getListPrice(p);
  const sale = getSalePrice(p);
  const onSale = p.is_on_sale && p.discount_pct > 0 && sale < list;

  return (
    <div
      className={cn("product-card h-full", out && "is-sold-out")}
      data-clickable={out ? "false" : "true"}
      onClick={() => !out && onOpen(p)}
      role="button"
      tabIndex={out ? -1 : 0}
      aria-disabled={out}
      onKeyDown={(e) => {
        if (out) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(p);
        }
      }}
      aria-label={`${p.name}, ${formatCurrency(sale, p.currency)}${p.warranty ? `, Garantía: ${p.warranty}` : ""}`}
    >
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            width={400}
            height={400}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-[filter,opacity]",
              out && "grayscale opacity-70"
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <svg xmlns='http://www.w3.org/2000/svg' className='w-12 h-12 text-muted-foreground/30' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/></svg>
          </div>
        )}
        <ProductBadges p={p} />
        {out && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold uppercase tracking-wide shadow">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-1 flex-nowrap">
            <h3 className="font-bold text-base leading-snug truncate flex-1 min-w-0">
              {p.name}
            </h3>
            <span
              className={cn(
                "text-base font-semibold tracking-tight shrink-0 whitespace-nowrap",
                onSale ? "text-secondary" : "text-foreground"
              )}
            >
              {formatCurrency(sale, p.currency)}
            </span>
          </div>

          {onSale && (
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(list, p.currency)}
              </span>
              <span className="animate-sale text-xs font-bold text-primary">-{p.discount_pct}%</span>
            </div>
          )}

          {p.warranty && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
              <strong className="text-foreground/80 font-medium">Garantía:</strong> {p.warranty}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(p);
            }}
            disabled={out}
            className={cn(
              "flex-1 h-11 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              "bg-primary text-primary-foreground hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-card-hover",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <Eye className="w-4 h-4" />
            <span>Ver detalles</span>
          </button>
          <button
            type="button"
            aria-label={`Añadir ${p.name} al carrito`}
            disabled={out}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(p, e.currentTarget);
            }}
            className={cn(
              "w-11 h-11 rounded-2xl border-2 border-secondary text-secondary flex items-center justify-center transition-all",
              "hover:bg-secondary hover:text-secondary-foreground hover:-translate-y-0.5",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized so the catalog grid doesn't re-render every card when
 * unrelated state (search, filter, cart count) changes in the parent.
 * Only re-renders when this specific product or its callbacks change.
 */
export const ProductCard = memo(ProductCardImpl);
