import { useCallback, useEffect, useState } from "react";
import { getStoreStatus, type StoreScheduleSettings, type StoreStatus } from "@/lib/store-status";

/**
 * Subscribes to store open/closed status and refreshes it every 30s.
 * - Cleans up the interval on unmount or when schedule inputs change.
 * - Depends on primitive schedule fields (not the settings object identity)
 *   so callers passing a fresh object every render don't tear down the timer.
 */
export function useStoreStatus(settings: StoreScheduleSettings | null | undefined): StoreStatus {
  const openTime = settings?.open_time ?? "";
  const closeTime = settings?.close_time ?? "";
  const openDaysKey = settings?.open_days?.join(",") ?? "";

  const compute = useCallback((): StoreStatus => {
    if (!openTime || !closeTime) return getStoreStatus(null);
    return getStoreStatus({
      open_time: openTime,
      close_time: closeTime,
      open_days: openDaysKey ? openDaysKey.split(",").map((n) => Number(n)) : [],
    });
  }, [openTime, closeTime, openDaysKey]);

  const [status, setStatus] = useState<StoreStatus>(() => compute());

  useEffect(() => {
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
