import { useEffect, useState } from "react";
import { getStoreStatus, type StoreScheduleSettings, type StoreStatus } from "@/lib/store-status";

export function useStoreStatus(settings: StoreScheduleSettings | null | undefined): StoreStatus {
  const [status, setStatus] = useState<StoreStatus>(() => getStoreStatus(settings));

  useEffect(() => {
    setStatus(getStoreStatus(settings));
    const id = window.setInterval(() => {
      setStatus(getStoreStatus(settings));
    }, 30_000);
    return () => window.clearInterval(id);
  }, [settings]);

  return status;
}
