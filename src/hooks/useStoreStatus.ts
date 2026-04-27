import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoreStatus, type StoreScheduleSettings, type StoreStatus } from "@/lib/store-status";

/**
 * Subscribes to store open/closed status and refreshes it every 30s.
 * - Cleans up the interval on unmount or when schedule inputs change.
 * - Depends on primitive schedule fields (not the settings object identity)
 *   so callers passing a fresh object every render don't tear down the timer.
 */
export function useStoreStatus(settings: StoreScheduleSettings | null | undefined): StoreStatus {
  // Stable primitive deps so a new `settings` object reference with identical
  // values doesn't restart the interval.
  const openTime = settings?.open_time;
  const closeTime = settings?.close_time;
  const openDaysKey = settings?.open_days?.join(",") ?? "";

  // Rebuild the schedule object only when its primitive fields change.
  const schedule = useMemo<StoreScheduleSettings | null>(() => {
    if (!openTime || !closeTime) return null;
    return {
      open_time: openTime,
      close_time: closeTime,
      open_days: openDaysKey ? openDaysKey.split(",").map((n) => Number(n)) : [],
    };
  }, [openTime, closeTime, openDaysKey]);

  const compute = useCallback(() => getStoreStatus(schedule), [schedule]);

  const [status, setStatus] = useState<StoreStatus>(() => compute());

  useEffect(() => {
    // Recompute immediately when inputs change, then poll every 30s.
    setStatus(compute());
    const id = window.setInterval(() => {
      setStatus(compute());
    }, 30_000);
    return () => {
      window.clearInterval(id);
    };
  }, [compute]);

  return status;
}
