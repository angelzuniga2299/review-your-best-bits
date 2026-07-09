import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/catalog";
import { getSalePrice, isOutOfStock } from "@/lib/catalog";

const CART_KEY = "insignia_cart_v1";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (!Array.isArray(parsed)) {
      if (!parsed.savedAt || Date.now() - parsed.savedAt > SEVEN_DAYS) {
        localStorage.removeItem(CART_KEY);
        return [];
      }
      const data = parsed.items ?? [];
      return data.map((item: CartItem) => ({
        ...item,
        stock: typeof item.stock === 'number' ? item.stock : 0,
        qty: typeof item.stock === 'number'
          ? Math.min(item.qty, item.por_encargo ? item.qty : Math.max(item.stock, 1))
          : 1,
      }));
    }
    return parsed.map((item: CartItem) => ({
      ...item,
      stock: typeof item.stock === 'number' ? item.stock : 0,
      qty: typeof item.stock === 'number'
        ? Math.min(item.qty, item.por_encargo ? item.qty : Math.max(item.stock, 1))
        : 1,
    }));
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({ items, savedAt: Date.now() }));
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
      const cap = p.por_encargo ? Infinity : Math.max(p.stock, 0);
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
          stock: p.stock,
        },
      ];
    });
    return true;
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      const item = prev.find((x) => x.productId === productId);
      if (!item) return prev;
      const cap = item.por_encargo ? Infinity : (typeof item.stock === 'number' ? item.stock : 1);
      const nextQty = Math.min(qty, cap);
      if (nextQty <= 0) return prev.filter((x) => x.productId !== productId);
      if (nextQty === item.qty) return prev;
      return prev.map((x) => (x.productId === productId ? { ...x, qty: nextQty } : x));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, total, currency } = useMemo(() => {
    let c = 0;
    let t = 0;
    for (const x of items) {
      c += x.qty;
      t += x.price * x.qty;
    }
    return { count: c, total: t, currency: items[0]?.currency ?? "USD" };
  }, [items]);

  // Memoize return so consumers see a stable object reference when nothing
  // changed — keeps React.memo / useEffect deps from firing unnecessarily.
  return useMemo(
    () => ({ items, add, remove, setQty, clear, count, total, currency }),
    [items, add, remove, setQty, clear, count, total, currency]
  );
}
