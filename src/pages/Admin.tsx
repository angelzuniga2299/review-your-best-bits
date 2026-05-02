import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, BarChart3, Settings as SettingsIcon, Users, LogOut, ArrowLeft, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFilters } from "@/hooks/useCatalogData";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { StatsTab } from "@/components/admin/StatsTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";

type Tab = "products" | "orders" | "categories" | "stats" | "users" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "products", label: "Productos", icon: <Package className="w-4 h-4" /> },
  { id: "orders", label: "Órdenes", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "categories", label: "Categorías", icon: <Tag className="w-4 h-4" /> },
  { id: "stats", label: "Stats", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "users", label: "Usuarios", icon: <Users className="w-4 h-4" /> },
  { id: "settings", label: "Ajustes", icon: <SettingsIcon className="w-4 h-4" /> },
];

const Admin = () => {
  const [tab, setTab] = useState<Tab>("products");
  const { data: filters } = useFilters();

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface border-b border-border px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label="Volver al catálogo"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="brand-logo text-xl">Panel Vendedor</span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-destructive/10 text-destructive font-bold uppercase"
        >
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </header>

      <nav className="bg-surface border-b border-border flex overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-foreground text-foreground bg-muted/40"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {tab === "products" && <ProductsTab filters={filters ?? []} />}
        {tab === "orders" && <OrdersTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "stats" && <StatsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
};

export default Admin;
