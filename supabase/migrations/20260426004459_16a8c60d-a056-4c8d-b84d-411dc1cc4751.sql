ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_time TEXT;
ALTER TABLE public.app_settings DROP COLUMN IF EXISTS commission_rate;