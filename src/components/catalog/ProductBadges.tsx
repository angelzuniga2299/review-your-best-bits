import { Sparkles, AlertCircle, Package } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { isOutOfStock, isPorEncargo } from "@/lib/catalog";

export function ProductBadges({ p }: { p: Product }) {
  const out = isOutOfStock(p);
  const enc = isPorEncargo(p);
  const lowStock = !p.por_encargo && p.stock > 0 && p.stock <= 3;

  return (
    <>
      {out && (
        <span className="badge-stock badge-stock--out">
          <AlertCircle className="w-3 h-3 mr-1" /> Agotado
        </span>
      )}
      {!out && enc && (
        <span className="badge-stock badge-stock--encargo">
          <Package className="w-3 h-3 mr-1" /> Por encargo
        </span>
      )}
      {!out && !enc && lowStock && (
        <span className="badge-stock badge-stock--low">¡Últimas {p.stock}!</span>
      )}
      {p.is_new && (
        <span className="badge-new">
          <Sparkles className="w-3 h-3 mr-1" /> Nuevo
        </span>
      )}
    </>
  );
}
