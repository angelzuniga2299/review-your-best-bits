import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Share2, Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { formatOpenDays } from "@/lib/store-status";
import { useStoreStatus } from "@/hooks/useStoreStatus";

interface SettingsLike {
  business_name?: string;
  business_info?: string;
  business_address?: string;
  open_time?: string;
  close_time?: string;
  open_days?: number[];
  whatsapp_number?: string;
}

interface StoreInfoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SettingsLike | null | undefined;
}

export function StoreInfoPanel({ open, onOpenChange, settings }: StoreInfoPanelProps) {
  const [copied, setCopied] = useState(false);
  const status = useStoreStatus(
    settings
      ? {
          open_time: settings.open_time ?? "09:00",
          close_time: settings.close_time ?? "18:00",
          open_days: settings.open_days ?? [1, 2, 3, 4, 5, 6],
        }
      : null
  );

  const businessName = settings?.business_name ?? "Insignia";
  const businessInfo = settings?.business_info ?? "";
  const address = settings?.business_address ?? "";
  const openTime = settings?.open_time ?? "09:00";
  const closeTime = settings?.close_time ?? "18:00";
  const openDays = settings?.open_days ?? [1, 2, 3, 4, 5, 6];
  const whatsapp = settings?.whatsapp_number ?? "";

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  async function handleShare() {
    const data = {
      title: businessName,
      text: businessInfo || `Visitá el catálogo de ${businessName}`,
      url: shareUrl,
    };
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share(data);
        return;
      } catch {
        // user cancelled or failed → fallback to copy
      }
    }
    handleCopy();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  function openWhatsApp() {
    if (!whatsapp) return;
    const msg = encodeURIComponent(`Hola, vi su catálogo de ${businessName} y quería consultar.`);
    window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank", "noopener");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[90vw] sm:max-w-[400px] overflow-y-auto p-0"
      >
        <div className="p-6 space-y-6">
          <SheetHeader className="text-left space-y-2">
            <SheetTitle className="brand-logo text-3xl">{businessName}</SheetTitle>
            {businessInfo && (
              <SheetDescription className="text-sm leading-relaxed">
                {businessInfo}
              </SheetDescription>
            )}
          </SheetHeader>

          {/* Status badge */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              status.isOpen
                ? "border-green-500/30 bg-green-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            <span
              className={`relative flex h-3 w-3 shrink-0 ${status.isOpen ? "" : ""}`}
              aria-hidden
            >
              {status.isOpen && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  status.isOpen ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-base font-semibold ${
                  status.isOpen ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                }`}
              >
                {status.label}
              </p>
              <p className="text-xs text-muted-foreground">{status.nextChangeLabel}</p>
            </div>
          </div>

          {/* Schedule */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Horario de atención
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">{formatOpenDays(openDays)}</p>
              <p className="text-muted-foreground">
                {openTime} – {closeTime}
              </p>
            </div>
          </section>

          {/* Address */}
          {address && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Dirección
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
                {address}
              </div>
            </section>
          )}

          {/* WhatsApp */}
          {whatsapp && (
            <Button
              type="button"
              onClick={openWhatsApp}
              className="w-full gap-2"
              variant="default"
            >
              <MessageCircle className="h-4 w-4" />
              Contactar por WhatsApp
            </Button>
          )}

          {/* Share */}
          <section className="space-y-2">
            <p className="text-sm font-medium text-foreground">Compartir tienda</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Compartir
              </Button>
              <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
