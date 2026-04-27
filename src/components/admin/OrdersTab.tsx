import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/lib/catalog";
import { formatCurrency } from "@/lib/catalog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const STATUSES: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pendiente", label: "Pendiente" },
  { id: "vendido", label: "Vendido" },
  { id: "cancelado", label: "Cancelado" },
];

const BADGE: Record<OrderStatus, string> = {
  pendiente: "bg-warning/15 text-warning",
  contactado: "bg-info/15 text-info",
  vendido: "bg-success/15 text-success",
  cancelado: "bg-destructive/15 text-destructive",
};

export function OrdersTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    refetchOnWindowFocus: true,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (orders ?? []).filter((o) => filter === "all" || o.status === filter);

  // Group orders by day label (Hoy, Ayer, fecha) preserving sort order.
  const groups = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const buckets = new Map<string, { label: string; orders: Order[]; total: number }>();

    function labelFor(d: Date): { key: string; label: string } {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      if (day.getTime() === today.getTime()) return { key: "0-today", label: "Hoy" };
      if (day.getTime() === yesterday.getTime()) return { key: "1-yest", label: "Ayer" };
      const key = `2-${day.toISOString().slice(0, 10)}`;
      const label = day.toLocaleDateString("es-CU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      return { key, label };
    }

    for (const o of list) {
      const { key, label } = labelFor(new Date(o.created_at));
      const bucket = buckets.get(key) ?? { label, orders: [], total: 0 };
      bucket.orders.push(o);
      // Daily total only counts confirmed sales to be meaningful.
      if (o.status === "vendido") bucket.total += Number(o.total) || 0;
      buckets.set(key, bucket);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  })();

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter(s.id)}
            data-active={filter === s.id}
            className="filter-pill"
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Sin pedidos.</p>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, group]) => (
            <section key={key} className="space-y-3">
              <header className="flex items-baseline justify-between gap-3 px-1">
                <h3 className="text-sm font-bold capitalize">{group.label}</h3>
                <span className="text-xs text-muted-foreground">
                  {group.orders.length} pedido{group.orders.length === 1 ? "" : "s"}
                  {group.total > 0 && (
                    <span className="ml-2 text-foreground font-semibold">
                      · {formatCurrency(group.total, group.orders[0]?.currency ?? "USD")}
                    </span>
                  )}
                </span>
              </header>
              <div className="space-y-3">
                {group.orders.map((o) => (
            <article
              key={o.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(o)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(o);
                }
              }}
              className="bg-surface border border-border rounded-xl p-4 space-y-3 cursor-pointer hover:border-primary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="text-sm font-semibold">{o.public_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("es-CU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${BADGE[o.status]}`}
                >
                  {o.status}
                </span>
              </div>

              <ul className="space-y-1">
                {o.items.map((it, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    {it.name}{" "}
                    <span className="text-muted-foreground">×{it.qty}</span> —{" "}
                    {formatCurrency(it.price * it.qty, it.currency)}
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-bold">
                  Total: {formatCurrency(o.total, o.currency)}
                </span>
                <select
                  value={o.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus });
                  }}
                  className="text-xs border border-border rounded-lg px-2 py-1 bg-surface"
                >
                  {STATUSES.filter((s) => s.id !== "all").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md bg-surface">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selected.public_id}</DialogTitle>
                <DialogDescription className="text-xs">
                  {new Date(selected.created_at).toLocaleString("es-CU", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${BADGE[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                </div>

                <div className="border border-border rounded-xl divide-y divide-border">
                  {selected.items.map((it, i) => (
                    <div key={i} className="p-3 flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{it.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(it.price, it.currency)} × {it.qty}
                        </p>
                      </div>
                      <span className="text-sm font-semibold shrink-0">
                        {formatCurrency(it.price * it.qty, it.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                {(selected.customer_name || selected.customer_phone || selected.notes) && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {selected.customer_name && <p>Cliente: {selected.customer_name}</p>}
                    {selected.customer_phone && <p>Teléfono: {selected.customer_phone}</p>}
                    {selected.notes && <p>Notas: {selected.notes}</p>}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-base font-bold">
                    {formatCurrency(selected.total, selected.currency)}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
