// Pure logic for store open/closed status

export interface StoreScheduleSettings {
  open_time: string; // "HH:mm"
  close_time: string; // "HH:mm"
  open_days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface StoreStatus {
  isOpen: boolean;
  label: string; // "Abierto" | "Cerrado"
  nextChangeLabel: string; // e.g. "Cierra a las 18:00" | "Abre mañana 09:00"
}

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function parseHHMM(value: string): { h: number; m: number } | null {
  if (!value || typeof value !== "string") return null;
  const parts = value.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

function toMinutes(h: number, m: number) {
  return h * 60 + m;
}

function formatHHMM(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getStoreStatus(
  settings: StoreScheduleSettings | null | undefined,
  now: Date = new Date()
): StoreStatus {
  if (!settings) {
    return {
      isOpen: false,
      label: "Cerrado",
      nextChangeLabel: "Horario no disponible",
    };
  }

  const open = parseHHMM(settings.open_time);
  const close = parseHHMM(settings.close_time);
  const openDays = Array.isArray(settings.open_days) ? settings.open_days : [];

  if (!open || !close || openDays.length === 0) {
    return {
      isOpen: false,
      label: "Cerrado",
      nextChangeLabel: "Horario no configurado",
    };
  }

  const today = now.getDay();
  const nowMin = toMinutes(now.getHours(), now.getMinutes());
  const openMin = toMinutes(open.h, open.m);
  const closeMin = toMinutes(close.h, close.m);

  const isTodayOpenDay = openDays.includes(today);
  const isOpen =
    isTodayOpenDay && nowMin >= openMin && nowMin < closeMin;

  if (isOpen) {
    return {
      isOpen: true,
      label: "Abierto",
      nextChangeLabel: `Cierra a las ${formatHHMM(close.h, close.m)}`,
    };
  }

  // Closed: figure out next opening
  // If today is an open day and we're before opening time → opens today
  if (isTodayOpenDay && nowMin < openMin) {
    return {
      isOpen: false,
      label: "Cerrado",
      nextChangeLabel: `Abre hoy a las ${formatHHMM(open.h, open.m)}`,
    };
  }

  // Otherwise look forward up to 7 days for the next open day
  for (let i = 1; i <= 7; i++) {
    const d = (today + i) % 7;
    if (openDays.includes(d)) {
      const dayLabel = i === 1 ? "mañana" : DAY_NAMES[d];
      return {
        isOpen: false,
        label: "Cerrado",
        nextChangeLabel: `Abre ${dayLabel} ${formatHHMM(open.h, open.m)}`,
      };
    }
  }

  return {
    isOpen: false,
    label: "Cerrado",
    nextChangeLabel: "Sin próximos horarios",
  };
}

export function formatOpenDays(openDays: number[]): string {
  if (!openDays || openDays.length === 0) return "Sin días configurados";
  const sorted = [...openDays].sort((a, b) => a - b);
  // Detect contiguous range
  const isContiguous = sorted.every(
    (d, i) => i === 0 || d === sorted[i - 1] + 1
  );
  if (isContiguous && sorted.length > 1) {
    return `${capitalize(DAY_NAMES[sorted[0]])} a ${DAY_NAMES[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => capitalize(DAY_NAMES[d])).join(", ");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
