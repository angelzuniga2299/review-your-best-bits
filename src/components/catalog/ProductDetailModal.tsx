import { useEffect } from "react";
import { X, MessageCircle, Plus } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { formatCurrency, getListPrice, getSalePrice, isOutOfStock, isPorEncargo } from "@/lib/catalog";

type Props = {
  product: Product | null;
  onClose: () => void;
  onOrderWhatsApp: (p: Product) => void;
  onAddToCart: (p: Product) => void;
};

export function ProductDetailModal({ product, onClose, onOrderWhatsApp, onAddToCart }: Props) {
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const p = product;
  const out = isOutOfStock(p);
  const enc = isPorEncargo(p);
  const list = getListPrice(p);
  const sale = getSalePrice(p);
  const onSale = p.is_on_sale && p.discount_pct > 0 && sale < list;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-black/45 backdrop-blur-sm animate-sheet-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pd-title"
      onClick={onClose}
    >
      <div
        className="relative bg-surface-muted w-full max-h-[min(92vh,720px)] sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/95 text-muted-foreground hover:text-foreground shadow-sm border border-border"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="shrink-0 relative bg-muted">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="w-full h-[min(38vh,260px)] sm:h-64 object-cover" />
          ) : (
            <div className="w-full h-[min(38vh,260px)] sm:h-64 flex items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 sm:px-6 sm:pt-6 space-y-4">
          <header className="pr-10 flex items-baseline justify-between gap-3">
            <h2 id="pd-title" className="text-xl font-bold leading-tight flex-1">
              {p.name}
            </h2>
            <div className="text-xl font-bold tracking-tight shrink-0">
              {formatCurrency(sale, p.currency)}
            </div>
          </header>

          {onSale && (
            <div className="flex items-center gap-2 -mt-2">
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(list, p.currency)}
              </span>
              <span className="text-sm text-primary font-semibold">-{p.discount_pct}%</span>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Detalles</p>
            <p className="text-sm text-foreground/80 whitespace-pre-line">
              {p.description?.trim() ||
                "Consulta por WhatsApp para más información o pide una descripción detallada."}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {out ? (
              <span className="text-destructive font-semibold">Sin stock</span>
            ) : enc ? (
              <span className="text-info font-semibold">Por encargo · 7-15 días</span>
            ) : (
              <span>{p.stock} unidades disponibles</span>
            )}
          </div>

          {p.warranty && (
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Garantía:</strong> {p.warranty}
            </p>
          )}
        </div>

        <footer className="shrink-0 px-5 py-4 sm:px-6 sm:py-5 border-t border-border bg-surface flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={out}
            onClick={() => onAddToCart(p)}
            className="h-12 px-4 rounded-xl border-2 border-secondary text-secondary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary hover:text-secondary-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus className="w-4 h-4" />
            Añadir al carrito
          </button>
          <button
            type="button"
            disabled={out}
            onClick={() => onOrderWhatsApp(p)}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-md"
          >
            <MessageCircle className="w-5 h-5" />
            Ordenar por WhatsApp
          </button>
        </footer>
      </div>
    </div>
  );
}
