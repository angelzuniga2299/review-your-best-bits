import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product, ProductFilter } from "@/lib/catalog";
import { formatCurrency, getSalePrice } from "@/lib/catalog";


const empty: Partial<Product> = {
  name: "",
  description: "",
  category: "all",
  price: 0,
  currency: "USD",
  stock: 0,
  por_encargo: false,
  delivery_time: "",
  is_on_sale: false,
  discount_pct: 0,
  image_url: "",
  gallery_urls: [],
  warranty: "",
  is_new: false,
  sort_order: 0,
};


const BUCKET = "product-images";

export function ProductsTab({ filters }: { filters: ProductFilter[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Partial<Product>) => {
      const payload = {
        name: p.name?.trim() ?? "",
        description: p.description ?? "",
        category: p.category ?? "all",
        price: Number(p.price) || 0,
        currency: p.currency ?? "USD",
        stock: Number(p.stock) || 0,
        por_encargo: !!p.por_encargo,
        delivery_time: p.por_encargo ? (p.delivery_time?.trim() || null) : null,
        is_on_sale: !!p.is_on_sale,
        discount_pct: Math.max(0, Math.min(95, Number(p.discount_pct) || 0)),
        image_url: p.image_url ?? "",
        gallery_urls: Array.isArray(p.gallery_urls) ? p.gallery_urls : [],
        warranty: p.warranty ?? "",
        is_new: !!p.is_new,
        sort_order: Number(p.sort_order) || 0,
      };
      if (p.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      toast.success("Producto guardado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="search"
          placeholder="Buscar producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-surface"
        />
        <button
          type="button"
          onClick={() => setEditing({ ...empty })}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Sin productos.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
            >
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(getSalePrice(p), p.currency)} ·{" "}
                  {p.por_encargo ? "Por encargo" : `Stock: ${p.stock}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar "${p.name}"?`)) remove.mutate(p.id);
                }}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductEditModal
          product={editing}
          filters={filters}
          onClose={() => setEditing(null)}
          onSave={(p) => upsert.mutate(p)}
          saving={upsert.isPending}
        />
      )}
    </div>
  );
}

function ProductEditModal({
  product,
  filters,
  onClose,
  onSave,
  saving,
}: {
  product: Partial<Product>;
  filters: ProductFilter[];
  onClose: () => void;
  onSave: (p: Partial<Product>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Product>>({
    ...product,
    gallery_urls: product.gallery_urls ?? [],
  });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  function set<K extends keyof Product>(k: K, v: Product[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setGalleryUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      setForm((f) => ({
        ...f,
        gallery_urls: [...(f.gallery_urls ?? []), pub.publicUrl],
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir";
      toast.error(`No se pudo subir la imagen: ${msg}`);
    } finally {
      setGalleryUploading(false);
    }
  }

  function handleRemoveGallery(index: number) {
    setForm((f) => ({
      ...f,
      gallery_urls: (f.gallery_urls ?? []).filter((_, i) => i !== index),
    }));
  }

  function handleSetPrimary(index: number) {
    setForm((f) => {
      const gallery = [...(f.gallery_urls ?? [])];
      const newPrimary = gallery[index];
      if (!newPrimary) return f;
      const oldPrimary = f.image_url?.trim() ? f.image_url : "";
      gallery.splice(index, 1);
      if (oldPrimary) gallery.push(oldPrimary);
      return { ...f, image_url: newPrimary, gallery_urls: gallery };
    });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPendingFile(null);
    }
  }

  return (

    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex justify-between items-center">
          <h2 className="text-base font-bold">
            {form.id ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form
          className="p-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.name?.trim()) {
              toast.error("El nombre es obligatorio");
              return;
            }
            let finalForm = form;
            if (pendingFile) {
              setUploading(true);
              try {
                const fileName = `${Date.now()}-${pendingFile.name}`;
                const { error: upErr } = await supabase.storage
                  .from(BUCKET)
                  .upload(fileName, pendingFile, { upsert: true });
                if (upErr) throw upErr;
                const { data: pub } = supabase.storage
                  .from(BUCKET)
                  .getPublicUrl(fileName);
                finalForm = { ...form, image_url: pub.publicUrl };
                setForm(finalForm);
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Error al subir";
                toast.error(`No se pudo subir la imagen: ${msg}`);
                setUploading(false);
                return;
              }
              setUploading(false);
            }
            onSave(finalForm);
          }}
        >
          <Field label="Nombre">
            <input
              required
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
            />
          </Field>

          <Field label="Descripción">
            <textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <select
                value={form.category ?? "all"}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              >
                {filters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Moneda">
              <select
                value={form.currency ?? "USD"}
                onChange={(e) => set("currency", e.target.value as "USD" | "CUP")}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              >
                <option value="USD">USD</option>
                <option value="CUP">CUP</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio lista">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price ?? 0}
                onChange={(e) => set("price", Number(e.target.value))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min={0}
                value={form.stock ?? 0}
                onChange={(e) => set("stock", Number(e.target.value))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              />
            </Field>
          </div>

          <Field label="Imagen">
            <div className="space-y-2">
              {(previewUrl || form.image_url) && (
                <img
                  src={previewUrl || form.image_url}
                  alt="Vista previa"
                  className="w-20 h-20 object-cover rounded-lg border border-border"
                />
              )}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-sm font-medium cursor-pointer hover:bg-muted transition-colors">
                {uploading ? "Subiendo…" : "Seleccionar imagen"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </Field>

          <Field label="Galería de imágenes">
            <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
              {((form.image_url && form.image_url.trim()) || (form.gallery_urls?.length ?? 0) > 0) ? (
                <div className="grid grid-cols-4 gap-2">
                  {form.image_url && form.image_url.trim() && (
                    <div className="relative group">
                      <img
                        src={form.image_url}
                        alt="Principal"
                        className="w-full aspect-square object-cover rounded-lg border-2 border-primary"
                      />
                      <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Principal
                      </span>
                    </div>
                  )}
                  {(form.gallery_urls ?? []).map((url, i) => (
                    <div key={`${url}-${i}`} className="relative group">
                      <img
                        src={url}
                        alt={`Galería ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGallery(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"
                        aria-label="Eliminar imagen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(i)}
                        className="absolute bottom-1 left-1 right-1 text-[9px] font-semibold bg-background/90 hover:bg-background text-foreground rounded px-1 py-0.5 transition-colors"
                      >
                        Hacer principal
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sin imágenes adicionales.</p>
              )}

              {((form.gallery_urls?.length ?? 0) + (form.image_url?.trim() ? 1 : 0)) < 8 && (
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-sm font-medium cursor-pointer hover:bg-muted transition-colors">
                  {galleryUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Agregar imagen
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleGalleryUpload}
                    disabled={galleryUploading}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-[11px] text-muted-foreground">
                {(form.gallery_urls?.length ?? 0) + (form.image_url?.trim() ? 1 : 0)} / 8 imágenes
              </p>
            </div>
          </Field>



          <Field label="Garantía">
            <select
              value={form.warranty ?? ""}
              onChange={(e) => set("warranty", e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
            >
              <option value="">Sin garantía</option>
              <option value="7 days">7 days</option>
              <option value="14 days">14 days</option>
              <option value="30 days">30 days</option>
              <option value="60 days">60 days</option>
              <option value="90 days">90 days</option>
              <option value="1 year">1 year</option>
              <option value="Lifetime">Lifetime</option>
            </select>
          </Field>

          <div className="pt-2 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Toggle
                label="Marcar Por Encargo"
                value={!!form.por_encargo}
                onChange={(v) => set("por_encargo", v)}
              />
              <Toggle
                label="Marcar como Nuevo"
                value={!!form.is_new}
                onChange={(v) => set("is_new", v)}
              />
              <Toggle
                label="En Oferta"
                value={!!form.is_on_sale}
                onChange={(v) => set("is_on_sale", v)}
              />
            </div>
            {form.por_encargo && (
              <Field label="Tiempo de entrega">
                <input
                  value={form.delivery_time ?? ""}
                  onChange={(e) => set("delivery_time", e.target.value)}
                  placeholder="ej: 7-15 días"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                />
              </Field>
            )}
            {form.is_on_sale && (
              <Field label="Descuento %">
                <input
                  type="number"
                  min={0}
                  max={95}
                  value={form.discount_pct ?? 0}
                  onChange={(e) => set("discount_pct", Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                />
              </Field>
            )}
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        value
          ? "bg-primary text-primary-foreground border-primary hover:bg-primary-hover"
          : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
