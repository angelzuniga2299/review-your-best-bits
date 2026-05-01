import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductFilter, AppSettings } from "@/lib/catalog";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

export function useFilters() {
  return useQuery({
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
}

export function useSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return {
          whatsapp_number: "",
          business_name: "Insignia",
          business_info: "Catálogo de electrodomésticos",
          business_address: "La Habana, Cuba",
          open_time: "09:00",
          close_time: "18:00",
          open_days: [1, 2, 3, 4, 5, 6],
        };
      }
      return data as AppSettings;
    },
  });
}
