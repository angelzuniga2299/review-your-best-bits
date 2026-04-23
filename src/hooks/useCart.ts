import { useCallback, useEffect, useState } from "react";
import type { CartItem, Product } from "@/lib/catalog";
import { getSalePrice, isOutOfStock } from "@/lib/catalog";

const CART_KEY = "insignia_cart_v1";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => load());

  useEffect(() => {
    save(items);
  }, [items]);

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === CART_KEY) setItems(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((p: Product, qty = 1) => {
    if (isOutOfStock(p)) return false;
    setItems((prev) => {
      const existing = prev.find((x) => x.productId === p.id);
      const price = getSalePrice(p);
      const cap = p.por_encargo ? Infinity : p.stock;
      if (existing) {
        const nextQty = Math.min(existing.qty + qty, cap);
        if (nextQty === existing.qty) return prev;
        return prev.map((x) => (x.productId === p.id ? { ...x, qty: nextQty } : x));
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price,
          currency: p.currency,
          qty: Math.min(qty, cap),
          image_url: p.image_url,
          por_encargo: p.por_encargo,
        },
      ];
    });
    return true;
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((x) => x.productId !== productId)
        : prev.map((x) => (x.productId === productId ? { ...x, qty } : x))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((acc, x) => acc + x.qty, 0);
  const total = items.reduce((acc, x) => acc + x.price * x.qty, 0);
  const currency = items[0]?.currency ?? "USD";

  return { items, add, remove, setQty, clear, count, total, currency };
}
