import { useEffect } from "react";
import { X, Trash2, Plus, Minus, MessageCircle } from "lucide-react";
import type { CartItem, Currency } from "@/lib/catalog";
import { formatCurrency } from "@/lib/catalog";

type Props = {
  open: boolean;
  items: CartItem[];
  total: number;
  currency: Currency;
  notes: string;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onRemove: (productId: string) => void;
  onSetQty: (productId: string, qty: number) => void;
  onCheckout: () => void;
  isProcessing?: boolean;
};

export function CartDrawer({
  open,
  items,
  total,
  currency,
  notes,
  onNotesChange,
  onClose,
  onRemove,
  onSetQty,
  onCheckout,
  isProcessing = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Carrito de compras"
    >
      <div
        className="w-full max-w-md bg-surface-muted h-full flex flex-col shadow-2xl animate-sheet-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold uppercase tracking-widest">Tu Carrito</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar carrito"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-base font-medium">Tu carrito está vacío</p>
              <p className="text-sm mt-1">Añade productos para continuar</p>
            </div>
          ) : (
            items.map((it) => (
              <div key={it.productId} className="flex gap-3 bg-surface rounded-xl p-3 border border-border">
                {it.image_url && (
                  <img
                    src={it.image_url}
                    alt={it.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug line-clamp-2">{it.name}</p>
                  <p className="text-sm font-bold mt-1">{formatCurrency(it.price, it.currency)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => onSetQty(it.productId, it.qty - 1)}
                      disabled={isProcessing}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{it.qty}</span>
                    <button
                      type="button"
                      onClick={() => onSetQty(it.productId, it.qty + 1)}
                      disabled={isProcessing}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(it.productId)}
                      disabled={isProcessing}
                      className="ml-auto text-destructive hover:opacity-70"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="p-6 border-t border-border bg-muted/40 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground text-sm">Total aproximado</span>
            <span className="text-lg font-semibold">{formatCurrency(total, currency)}</span>
          </div>
          {items.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Los precios se confirman al finalizar el pedido.
            </p>
          )}
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Notas adicionales (opcional)"
            rows={2}
            disabled={items.length === 0}
            aria-label="Notas adicionales para el pedido"
            className="w-full text-sm rounded-xl border border-border bg-surface px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 resize-none"
          />
          <button
            type="button"
            onClick={onCheckout}
            disabled={items.length === 0 || isProcessing}
            aria-busy={isProcessing}
            className="w-full bg-secondary text-secondary-foreground py-4 rounded-xl font-semibold shadow-lg text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
          >
            <MessageCircle className="w-5 h-5" />
            {isProcessing ? "Procesando..." : "Finalizar pedido por WhatsApp"}
          </button>
        </footer>
      </div>
    </div>
  );
}
