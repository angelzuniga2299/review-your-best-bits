export type Currency = "USD" | "CUP";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  currency: Currency;
  stock: number;
  por_encargo: boolean;
  is_on_sale: boolean;
  discount_pct: number;
  image_url: string | null;
  warranty: string | null;
  is_new: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductFilter = {
  id: string;
  label: string;
  icon: string | null;
  sort_order: number;
};

export type AppSettings = {
  whatsapp_number: string;
  business_name: string;
  business_info: string;
  business_address: string;
  open_time: string;
  close_time: string;
  open_days: number[];
  commission_rate: number;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  currency: Currency;
  qty: number;
  image_url: string | null;
  por_encargo: boolean;
};

export type OrderStatus = "pendiente" | "contactado" | "vendido" | "cancelado";

export type Order = {
  id: string;
  public_id: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    qty: number;
    currency: Currency;
  }>;
  total: number;
  currency: Currency;
  status: OrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const RESERVED_FILTERS = new Set(["all", "ofertas"]);

export function getListPrice(p: Product): number {
  return Number(p.price) || 0;
}

export function getSalePrice(p: Product): number {
  const list = getListPrice(p);
  if (!p.is_on_sale || !p.discount_pct) return list;
  return Math.round(list * (1 - p.discount_pct / 100) * 100) / 100;
}

export function isOutOfStock(p: Product): boolean {
  return !p.por_encargo && (Number(p.stock) || 0) <= 0;
}

export function isPorEncargo(p: Product): boolean {
  return p.por_encargo === true;
}

export function formatCurrency(amount: number, currency: Currency = "USD"): string {
  const value = Number(amount) || 0;
  const formatted = value.toLocaleString("es-CU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency === "CUP" ? `${formatted} CUP` : `$${formatted}`;
}
