-- Function: decrement stock atomically when an order is created
CREATE OR REPLACE FUNCTION public.apply_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  pid UUID;
  q INTEGER;
  current_stock INTEGER;
  is_encargo BOOLEAN;
  pname TEXT;
BEGIN
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' THEN
    RETURN NEW;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    BEGIN
      pid := (item->>'productId')::UUID;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    q := COALESCE((item->>'qty')::INTEGER, 0);
    IF pid IS NULL OR q <= 0 THEN
      CONTINUE;
    END IF;

    SELECT stock, por_encargo, name
      INTO current_stock, is_encargo, pname
      FROM public.products
      WHERE id = pid
      FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- Skip stock changes for "por encargo" products
    IF is_encargo THEN
      CONTINUE;
    END IF;

    IF current_stock < q THEN
      RAISE EXCEPTION 'Stock insuficiente para %: disponible %, solicitado %', pname, current_stock, q
        USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.products
      SET stock = stock - q,
          updated_at = now()
      WHERE id = pid;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_apply_stock ON public.orders;
CREATE TRIGGER trg_orders_apply_stock
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_order_stock();

-- Function: restore stock when an order is cancelled
CREATE OR REPLACE FUNCTION public.restore_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  pid UUID;
  q INTEGER;
  is_encargo BOOLEAN;
BEGIN
  -- Only act when status transitions TO 'cancelado' from something else
  IF NEW.status <> 'cancelado' OR OLD.status = 'cancelado' THEN
    RETURN NEW;
  END IF;

  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' THEN
    RETURN NEW;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    BEGIN
      pid := (item->>'productId')::UUID;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    q := COALESCE((item->>'qty')::INTEGER, 0);
    IF pid IS NULL OR q <= 0 THEN
      CONTINUE;
    END IF;

    SELECT por_encargo INTO is_encargo
      FROM public.products
      WHERE id = pid
      FOR UPDATE;

    IF NOT FOUND OR is_encargo THEN
      CONTINUE;
    END IF;

    UPDATE public.products
      SET stock = stock + q,
          updated_at = now()
      WHERE id = pid;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_restore_stock ON public.orders;
CREATE TRIGGER trg_orders_restore_stock
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_order_stock();

-- Safety net: ensure stock can never go below zero
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_stock_non_negative;
ALTER TABLE public.products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);