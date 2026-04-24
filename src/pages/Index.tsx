import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Search, Settings, Info } from "lucide-react";
import { useProducts, useFilters, useSettings } from "@/hooks/useCatalogData";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  formatCurrency,
  getSalePrice,
  isOutOfStock,
  type Product,
} from "@/lib/catalog";

import { FilterBar } from "@/components/catalog/FilterBar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductCardSkeleton } from "@/components/catalog/ProductCardSkeleton";
import { ProductDetailModal } from "@/components/catalog/ProductDetailModal";
import { CartDrawer } from "@/components/catalog/CartDrawer";
import { StoreInfoPanel } from "@/components/catalog/StoreInfoPanel";

const Index = () => {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: filters } = useFilters();
  const { data: settings } = useSettings();
  const { isAdmin } = useAuth();
  const cart = useCart();

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const cartIconRef = useRef<HTMLButtonElement>(null);

  const storeStatus = useStoreStatus(
    settings
      ? {
          open_time: settings.open_time ?? "09:00",
          close_time: settings.close_time ?? "18:00",
          open_days: settings.open_days ?? [1, 2, 3, 4, 5, 6],
        }
      : null
  );

  const visible = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeFilter === "ofertas") {
        if (!p.is_on_sale || p.discount_pct <= 0) return false;
      } else if (activeFilter !== "all" && p.category !== activeFilter) {
        return false;
      }
      if (q && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, activeFilter, search]);

  function flyToCart(sourceEl: HTMLElement) {
    const target = cartIconRef.current;
    if (!target) return;
    const sRect = sourceEl.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "fly-to-cart";
    ghost.style.left = `${sRect.left + sRect.width / 2 - 12}px`;
    ghost.style.top = `${sRect.top + sRect.height / 2 - 12}px`;
    ghost.style.width = "24px";
    ghost.style.height = "24px";
    ghost.style.borderRadius = "50%";
    ghost.style.background = "hsl(var(--primary))";
    ghost.style.setProperty(
      "--tx",
      `${tRect.left + tRect.width / 2 - sRect.left - sRect.width / 2}px`
    );
    ghost.style.setProperty(
      "--ty",
      `${tRect.top + tRect.height / 2 - sRect.top - sRect.height / 2}px`
    );
    document.body.appendChild(ghost);
    setTimeout(() => ghost.remove(), 800);
    target.classList.add("animate-pop");
    setTimeout(() => target.classList.remove("animate-pop"), 300);
  }

  function handleAdd(p: Product, sourceEl?: HTMLElement) {
    if (isOutOfStock(p)) {
      toast.error("Producto sin stock");
      return;
    }
    const ok = cart.add(p, 1);
    if (!ok) return;
    if (sourceEl) flyToCart(sourceEl);
    toast.success(`${p.name} añadido al carrito`);
  }

  function whatsAppLink(text: string) {
    const num = settings?.whatsapp_number ?? "5352996275";
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  }

  function orderSingleByWhatsApp(p: Product) {
    const price = getSalePrice(p);
    const msg = `Hola, me interesa este producto:\n\n*${p.name}*\nPrecio: ${formatCurrency(price, p.currency)}${
      p.por_encargo ? "\n(Por encargo)" : ""
    }\n\n¿Está disponible?`;
    window.open(whatsAppLink(msg), "_blank", "noopener");
    setDetail(null);
  }

  async function checkout() {
    if (cart.items.length === 0) return;
    const lines = cart.items
      .map(
        (it) =>
          `• ${it.name} ×${it.qty} — ${formatCurrency(it.price * it.qty, it.currency)}`
      )
      .join("\n");
    const msg = `Hola, quiero hacer este pedido:\n\n${lines}\n\n*Total aprox:* ${formatCurrency(
      cart.total,
      cart.currency
    )}`;

    // Persist order in DB (anyone can insert)
    try {
      await supabase.from("orders").insert({
        items: cart.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          qty: it.qty,
          currency: it.currency,
        })),
        total: cart.total,
        currency: cart.currency,
        status: "pendiente",
      });
    } catch {
      // No bloqueamos si falla el guardado
    }

    window.open(whatsAppLink(msg), "_blank", "noopener");
    cart.clear();
    setCartOpen(false);
    toast.success("Pedido enviado por WhatsApp");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface/95 backdrop-blur-md sticky top-0 z-40 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="brand-logo text-3xl sm:text-4xl">
                {settings?.business_name ?? "Insignia"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
                El futuro de tu confort, listo para ordenar
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Panel admin"
                >
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </Link>
              )}
              <button
                ref={cartIconRef}
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative p-2"
                aria-label="Abrir carrito"
              >
                <ShoppingCart className="w-6 h-6 text-foreground" />
                {cart.count > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-surface">
                    {cart.count}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <label htmlFor="catalog-search" className="sr-only">
              Buscar productos
            </label>
            <input
              id="catalog-search"
              type="search"
              placeholder="Buscar producto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-border rounded-2xl pl-10 pr-4 py-2.5 text-sm bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              aria-label="Información de la tienda"
            >
              <Info className="w-3.5 h-3.5 text-primary" />
              Información
            </button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                storeStatus.isOpen
                  ? "border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                  : "border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
              }`}
              aria-label={`Estado de la tienda: ${storeStatus.label}`}
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                {storeStatus.isOpen && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    storeStatus.isOpen ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </span>
              {storeStatus.label}
            </button>
          </div>

          <FilterBar
            filters={filters ?? []}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        {loadingProducts ? (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium text-foreground mb-1">Sin resultados</p>
            <p className="text-sm">Probá con otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={setDetail}
                onAdd={(prod, src) => handleAdd(prod, src)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-16 pb-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings?.business_name ?? "Insignia"}. Todos los derechos reservados.
          </p>
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Acceso vendedor
          </Link>
        </div>
      </footer>

      <ProductDetailModal
        product={detail}
        onClose={() => setDetail(null)}
        onOrderWhatsApp={orderSingleByWhatsApp}
        onAddToCart={(p) => {
          handleAdd(p);
          setDetail(null);
        }}
      />

      <CartDrawer
        open={cartOpen}
        items={cart.items}
        total={cart.total}
        currency={cart.currency}
        onClose={() => setCartOpen(false)}
        onRemove={cart.remove}
        onSetQty={cart.setQty}
        onCheckout={checkout}
      />

      <StoreInfoPanel
        open={infoOpen}
        onOpenChange={setInfoOpen}
        settings={settings}
      />
    </div>
  );
};

export default Index;
