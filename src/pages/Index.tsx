import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Search, Settings, Info } from "lucide-react";
import headerBg from "@/assets/header-bg.png";
import { useProducts, useFilters, useSettings } from "@/hooks/useCatalogData";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
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

  async function saveOrder(
    items: Array<{
      productId: string;
      name: string;
      price: number;
      qty: number;
      currency: Product["currency"];
    }>
  ) {
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const currency = items[0]?.currency ?? cart.currency;

    const { error } = await supabase.from("orders").insert({
      items,
      total,
      currency,
      status: "pendiente",
    });

    if (error) {
      console.error("Order insert failed:", error);
      throw error;
    }
  }

  async function orderSingleByWhatsApp(p: Product) {
    if (isProcessing) return;
    setIsProcessing(true);
    const price = getSalePrice(p);
    const items = [
      {
        productId: p.id,
        name: p.name,
        price,
        qty: 1,
        currency: p.currency,
      },
    ];
    const msg = `Hola, me interesa este producto:\n\n*${p.name}*\nPrecio: ${formatCurrency(price, p.currency)}${
      p.por_encargo ? "\n(Por encargo)" : ""
    }\n\n¿Está disponible?`;

    try {
      await saveOrder(items);
    } catch (err) {
      const m = (err as { message?: string })?.message ?? "";
      if (/Stock insuficiente/i.test(m)) {
        toast.error("Stock insuficiente. El catálogo se actualizó.");
      } else {
        toast.error("No se pudo registrar el pedido. Intentá de nuevo.");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
      ]);
      setIsProcessing(false);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
    ]);
    window.open(whatsAppLink(msg), "_blank", "noopener");
    setDetail(null);
    toast.success("Pedido registrado correctamente");
    setConfirmation("Pedido enviado correctamente");
    setIsProcessing(false);
  }

  async function checkout() {
    if (cart.items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    const items = cart.items.map((it) => ({
      productId: it.productId,
      name: it.name,
      price: it.price,
      qty: it.qty,
      currency: it.currency,
    }));
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

    // Persist order in DB FIRST so the seller always has a record,
    // even if the user never reaches WhatsApp.
    try {
      await saveOrder(items);
    } catch (err) {
      const m = (err as { message?: string })?.message ?? "";
      if (/Stock insuficiente/i.test(m)) {
        toast.error("Stock insuficiente para algún producto. Revisá el carrito.");
      } else {
        toast.error("No se pudo registrar el pedido. Intentá de nuevo.");
      }
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsProcessing(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["products"] });
    window.open(whatsAppLink(msg), "_blank", "noopener");
    cart.clear();
    setCartOpen(false);
    toast.success("Pedido registrado y enviado por WhatsApp");
    setConfirmation("Pedido enviado correctamente");
    setIsProcessing(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border overflow-hidden">
        {/* Background image + overlay */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${headerBg})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/75 backdrop-blur-[2px]"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="brand-logo text-3xl sm:text-4xl text-white drop-shadow-md">
                {settings?.business_name ?? "Insignia"}
              </h1>
              <p className="text-sm text-white/80 mt-1.5 leading-snug">
                El futuro de tu confort, listo para ordenar
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Panel admin"
                >
                  <Settings className="w-5 h-5 text-white/90" />
                </Link>
              )}
              <button
                ref={cartIconRef}
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative p-2"
                aria-label="Abrir carrito"
              >
                <ShoppingCart className="w-6 h-6 text-white" />
                {cart.count > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black/40">
                    {cart.count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Single row: Info pill + Status pill + Search */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur px-3 py-2 text-xs font-medium text-white hover:bg-white/25 transition-colors shrink-0"
              aria-label="Información de la tienda"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Información</span>
              <span className="xs:hidden">Info</span>
            </button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors shrink-0 backdrop-blur ${
                storeStatus.isOpen
                  ? "border border-green-400/50 bg-green-500/25 text-white hover:bg-green-500/35"
                  : "border border-red-400/50 bg-red-500/25 text-white hover:bg-red-500/35"
              }`}
              aria-label={`Estado de la tienda: ${storeStatus.label}`}
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                {storeStatus.isOpen && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-80" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    storeStatus.isOpen ? "bg-green-400" : "bg-red-400"
                  }`}
                />
              </span>
              {storeStatus.label}
            </button>

            <div className="relative flex-1 min-w-[180px]">
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
                className="w-full border border-white/30 rounded-full pl-10 pr-4 py-2 text-sm bg-white/95 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
              />
            </div>
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
        isProcessing={isProcessing}
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
        isProcessing={isProcessing}
      />

      <StoreInfoPanel
        open={infoOpen}
        onOpenChange={setInfoOpen}
        settings={settings}
      />

      {confirmation && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-sheet-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-confirmation-title"
          onClick={() => setConfirmation(null)}
        >
          <div
            className="bg-surface-muted rounded-2xl shadow-2xl border border-border max-w-sm w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-primary/15 text-primary mx-auto mb-4 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 id="order-confirmation-title" className="text-lg font-bold mb-1">
              {confirmation}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Te contactaremos por WhatsApp para coordinar la entrega.
            </p>
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
