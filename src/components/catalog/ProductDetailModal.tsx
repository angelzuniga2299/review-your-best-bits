import { useEffect, useState, useCallback } from "react";
import { X, MessageCircle, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
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

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  if (!product) return null;

  const p = product;
  const out = isOutOfStock(p);
  const enc = isPorEncargo(p);
  const list = getListPrice(p);
  const sale = getSalePrice(p);
  const onSale = p.is_on_sale && p.discount_pct > 0 && sale < list;

  const images = Array.from(
    new Set([p.image_url, ...(p.gallery_urls ?? [])].filter(Boolean))
  ) as string[];
  const hasMultiple = images.length > 1;

  return (
    <>
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

          <div className="relative shrink-0 w-full bg-muted overflow-hidden" style={{ maxHeight: "280px" }}>
            {images.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
            ) : !hasMultiple ? (
              <img
                src={images[0]}
                alt={p.name}
                onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                className="w-full object-contain cursor-zoom-in"
                style={{ maxHeight: "280px" }}
              />
            ) : (
              <>
                <div ref={emblaRef} className="overflow-hidden w-full">
                  <div className="flex">
                    {images.map((src, i) => (
                      <div key={i} className="flex-[0_0_100%] min-w-0 flex items-center justify-center bg-muted" style={{ maxHeight: "280px" }}>
                        <img
                          src={src}
                          alt={`${p.name} ${i + 1}`}
                          onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                          className="w-full object-contain cursor-zoom-in"
                          style={{ maxHeight: "280px" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollTo(i)}
                      aria-label={`Foto ${i + 1}`}
                      className={`rounded-full transition-all ${
                        i === activeIndex
                          ? "w-4 h-2 bg-white shadow"
                          : "w-2 h-2 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  aria-label="Foto anterior"
                  className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 text-white items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  aria-label="Foto siguiente"
                  className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 text-white items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
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

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Cerrar zoom"
          >
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {images.length}
            </p>
          )}
          <img
            src={images[lightboxIndex]}
            alt={p.name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[80vh] object-contain select-none"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`rounded-full transition-all ${
                    i === lightboxIndex ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
