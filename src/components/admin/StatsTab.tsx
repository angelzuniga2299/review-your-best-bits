import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Order, Product } from "@/lib/catalog";
import { formatCurrency } from "@/lib/catalog";

export function StatsTab() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pRes, oRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("orders").select("*"),
      ]);
      if (pRes.error) throw pRes.error;
      if (oRes.error) throw oRes.error;
      return {
        products: (pRes.data ?? []) as Product[],
        orders: (oRes.data ?? []) as Order[],
      };
    },
  });

  const products = data?.products ?? [];
  const orders = data?.orders ?? [];

  const totalProducts = products.length;
  const lowStock = products.filter((p) => !p.por_encargo && p.stock > 0 && p.stock <= 3);
  const sold = orders.filter((o) => o.status === "vendido");
  const revenue = sold.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const pending = orders.filter((o) => o.status === "pendiente").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Stat icon={<Package className="w-5 h-5" />} label="Productos" value={`${totalProducts}`} />
      <Stat
        icon={<ShoppingBag className="w-5 h-5" />}
        label="Pedidos pendientes"
        value={`${pending}`}
      />
      <Stat
        icon={<TrendingUp className="w-5 h-5" />}
        label="Ventas confirmadas"
        value={formatCurrency(revenue, "USD")}
      />
      <Stat
        icon={<AlertTriangle className="w-5 h-5" />}
        label="Stock bajo"
        value={`${lowStock.length}`}
        tone={lowStock.length > 0 ? "warning" : "default"}
      />

      {lowStock.length > 0 && (
        <div className="sm:col-span-2 bg-surface border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-2">Productos con stock bajo</p>
          <ul className="space-y-1 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="text-muted-foreground">
                {p.name} <span className="text-warning">({p.stock})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          tone === "warning" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
