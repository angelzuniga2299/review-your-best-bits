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
  { id: "contactado", label: "Contactado" },
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
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (orders ?? []).filter((o) => filter === "all" || o.status === filter);

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
        <div className="space-y-3">
          {list.map((o) => (
            <article
              key={o.id}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
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
                  onChange={(e) =>
                    updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })
                  }
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
      )}
    </div>
  );
}
