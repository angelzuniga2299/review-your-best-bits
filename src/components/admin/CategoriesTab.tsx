import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ProductFilter } from "@/lib/catalog";
import { RESERVED_FILTERS } from "@/lib/catalog";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function CategoriesTab() {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");

  const { data: filters = [], isLoading } = useQuery({
    queryKey: ["product_filters"],
    queryFn: async (): Promise<ProductFilter[]> => {
      const { data, error } = await supabase
        .from("product_filters")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProductFilter[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newLabel: string) => {
      const trimmed = newLabel.trim();
      if (!trimmed) throw new Error("Escribe un nombre para la categoría");

      let baseId = slugify(trimmed);
      if (!baseId) throw new Error("Nombre no válido");
      if (RESERVED_FILTERS.has(baseId)) baseId = `${baseId}-cat`;

      // Ensure unique id
      const existingIds = new Set(filters.map((f) => f.id));
      let id = baseId;
      let n = 2;
      while (existingIds.has(id)) {
        id = `${baseId}-${n++}`;
      }

      const maxSort = filters.reduce((m, f) => Math.max(m, f.sort_order ?? 0), 0);

      const { error } = await supabase.from("product_filters").insert({
        id,
        label: trimmed,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setLabel("");
      qc.invalidateQueries({ queryKey: ["product_filters"] });
      toast.success("Categoría agregada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_filters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_filters"] });
      toast.success("Categoría eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const target = index + direction;
      if (target < 0 || target >= filters.length) return;
      const a = filters[index];
      const b = filters[target];
      const sortA = a.sort_order ?? 0;
      const sortB = b.sort_order ?? 0;
      const newA = sortB;
      const newB = sortA === sortB ? sortA + (direction === 1 ? 1 : -1) : sortA;

      const { error: e1 } = await supabase
        .from("product_filters")
        .update({ sort_order: newA })
        .eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("product_filters")
        .update({ sort_order: newB })
        .eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_filters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    addMutation.mutate(label);
  }

  function handleDelete(f: ProductFilter) {
    if (RESERVED_FILTERS.has(f.id)) {
      toast.error("Esta categoría es del sistema y no se puede eliminar");
      return;
    }
    if (!window.confirm(`¿Eliminar la categoría "${f.label}"? Los productos asignados a ella seguirán existiendo, pero quedarán sin filtro.`)) {
      return;
    }
    deleteMutation.mutate(f.id);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Categorías</h2>
        <p className="text-sm text-muted-foreground">
          Estas categorías aparecen como filtros en el catálogo público.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nueva categoría (ej: Pequeños electrodomésticos)"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          maxLength={60}
        />
        <button
          type="submit"
          disabled={addMutation.isPending || !label.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
        >
          {addMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Agregar
        </button>
      </form>

      <div className="bg-surface border border-border rounded-xl divide-y divide-border">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Cargando…</div>
        ) : filters.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No hay categorías aún.</div>
        ) : (
          filters.map((f, idx) => {
            const isReserved = RESERVED_FILTERS.has(f.id);
            return (
              <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{f.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    id: {f.id}
                    {isReserved && " · sistema"}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => reorderMutation.mutate({ index: idx, direction: -1 })}
                    disabled={idx === 0 || reorderMutation.isPending}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Subir ${f.label}`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderMutation.mutate({ index: idx, direction: 1 })}
                    disabled={idx === filters.length - 1 || reorderMutation.isPending}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Bajar ${f.label}`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(f)}
                    disabled={isReserved || deleteMutation.isPending}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Eliminar ${f.label}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
