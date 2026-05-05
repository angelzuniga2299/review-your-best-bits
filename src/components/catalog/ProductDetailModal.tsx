import { useEffect } from "react";
import { X, MessageCircle, Plus, Share2 } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { formatCurrency, getListPrice, getSalePrice, isOutOfStock, isPorEncargo } from "@/lib/catalog";

type Props = {
  product: Product | null;
  onClose: () => void;
  onOrderWhatsApp: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  isProcessing?: boolean;
};

export function ProductDetailModal({ product, onClose, onOrderWhatsApp, onAddToCart, isProcessing = false }: Props) {
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

  async function handleShare() {
    const url = window.location.origin + "?producto=" + product.id;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

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

        <div className="shrink-0 relative aspect-square w-full mx-auto max-h-[220px] sm:max-h-[280px] bg-muted overflow-hidden" style={{ maxWidth: "min(100%, 280px)" }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <svg xmlns='http://www.w3.org/2000/svg' className='w-12 h-12 text-muted-foreground/30' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/></svg>
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
              <span className="text-info font-semibold">
                Por encargo · {p.delivery_time?.trim() || "7-15 días"}
              </span>
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

        <footer className="shrink-0 px-4 py-3 sm:px-6 sm:py-5 border-t border-border bg-surface grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={handleShare} className="order-3 sm:order-1 h-12 px-4 rounded-xl border border-border text-muted-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-muted transition-all w-full sm:w-auto">
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Compartir</span>
          </button>
          <button
            type="button"
            disabled={out || isProcessing}
            onClick={() => onAddToCart(p)}
            className="order-2 sm:order-1 h-12 px-4 rounded-xl border-2 border-secondary text-secondary font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none w-full sm:w-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Añadir al carrito</span>
          </button>
          <button
            type="button"
            disabled={out || isProcessing}
            aria-busy={isProcessing}
            onClick={() => onOrderWhatsApp(p)}
            className="order-1 sm:order-2 h-12 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md w-full whitespace-nowrap"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="truncate">{isProcessing ? "Procesando..." : "Ordenar por WhatsApp"}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
