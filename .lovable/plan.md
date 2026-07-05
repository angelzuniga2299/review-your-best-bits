

## Bloque de información en el header

Agregar un botón de información (icono `Info`) en el header, justo **antes** de la barra de filtros, que abra un panel lateral (`Sheet`) con los datos del negocio y el estado de apertura calculado en tiempo real.

### Lo que vas a ver

```text
┌─────────────────────────────────────────────┐
│ Insignia              [Settings] [🛒3]      │ ← header existente
│ El futuro de tu confort, listo para ordenar │
│                                             │
│ 🔍 Buscar producto...                       │ ← search existente
│                                             │
│ ⓘ Información   • ● Abierto                 │ ← NUEVO (compacto)
│                                             │
│ [Todos] [Ofertas] [Cocina] [Audio] ...      │ ← filtros intactos
└─────────────────────────────────────────────┘
```

Al tocar **ⓘ Información**, se abre desde la derecha un panel con:

- Logo / nombre de la tienda + descripción
- **Estado** con badge grande verde (Abierto) o rojo (Cerrado) + próximo horario ("Cierra a las 18:00" / "Abre mañana 09:00")
- **Horario** de atención (días + apertura–cierre)
- **Dirección** completa
- **WhatsApp** (botón directo)
- **Compartir**: botones para *Copiar enlace* y *Compartir* (usa `navigator.share` en mobile, fallback a copiar)

### Cómo se calcula Abierto / Cerrado

Función pura `getStoreStatus(settings, now)` en `src/lib/store-status.ts`:

1. Toma `open_days` (array tipo `[1,2,3,4,5,6]`, donde 0 = domingo).
2. Compara la hora actual con `open_time` y `close_time` (formato `HH:mm`).
3. Devuelve `{ isOpen: boolean, label: string, nextChangeLabel: string }`.
4. En `Index.tsx` un `useEffect` con `setInterval` de 30 s actualiza el estado para que reaccione en vivo sin recargar.

El badge mini en el header (junto a "Información") muestra solo un punto de color + texto corto, así no compite con los filtros.

### Archivos a tocar

- **NUEVO** `src/lib/store-status.ts` — lógica pura de horarios + tests mentales.
- **NUEVO** `src/components/catalog/StoreInfoPanel.tsx` — el `Sheet` (shadcn) con todo el contenido. Usa `useSettings()` que ya existe.
- **NUEVO** `src/hooks/useStoreStatus.ts` — hook que devuelve `{ isOpen, label, nextChangeLabel }` y se autorefresca cada 30 s.
- **EDIT** `src/pages/Index.tsx` — insertar la fila `[ⓘ Información] [● Abierto/Cerrado]` entre el `<input search>` y `<FilterBar>`. Estado local `infoOpen`. Sin tocar la estructura de filtros ni el grid de productos.

### Estilo

- Botón "Información" como pill discreta: borde `border-border`, texto `text-foreground`, icono `Info` de lucide a la izquierda. Hover suave.
- Badge de estado: punto `w-2 h-2 rounded-full` en `bg-green-500` / `bg-red-500` con `animate-pulse` cuando está abierto.
- Panel lateral usa `Sheet` de shadcn (ya instalado), respeta tokens HSL del design system Insignia.
- Mobile-first: el panel ocupa ~90% del ancho en móvil, 400 px en desktop.

### Lo que NO se toca

- `FilterBar.tsx` queda intacto.
- Grid de productos, carrito, modales, admin: sin cambios.
- Schema de DB: ya tenés todos los campos necesarios (`business_name`, `business_address`, `open_time`, `close_time`, `open_days`, `whatsapp_number`).
- No se agregan dependencias nuevas.

