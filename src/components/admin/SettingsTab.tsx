import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppSettings } from "@/lib/catalog";

export function SettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();
      if (error) throw error;
      return data as AppSettings;
    },
  });

  const [form, setForm] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({
          whatsapp_number: form.whatsapp_number,
          business_name: form.business_name,
          business_info: form.business_info,
          business_address: form.business_address,
          open_time: form.open_time,
          close_time: form.close_time,
        })
        .eq("id", true);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success("Ajustes guardados");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof AppSettings>(k: K, v: AppSettings[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  return (
    <div className="space-y-4 max-w-lg">
      <Field label="Nombre del negocio">
        <input
          value={form.business_name}
          onChange={(e) => set("business_name", e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
      </Field>

      <Field label="Número de WhatsApp (con código país, sin +)">
        <input
          value={form.whatsapp_number}
          onChange={(e) => set("whatsapp_number", e.target.value.replace(/\D/g, ""))}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
      </Field>

      <Field label="Información">
        <textarea
          rows={3}
          value={form.business_info}
          onChange={(e) => set("business_info", e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface resize-none"
        />
      </Field>

      <Field label="Dirección">
        <input
          value={form.business_address}
          onChange={(e) => set("business_address", e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Apertura">
          <input
            type="time"
            value={form.open_time}
            onChange={(e) => set("open_time", e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          />
        </Field>
        <Field label="Cierre">
          <input
            type="time"
            value={form.close_time}
            onChange={(e) => set("close_time", e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          />
        </Field>
      </div>

      {/* Comisiones eliminadas del panel vendedor */}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar ajustes"}
      </button>
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
