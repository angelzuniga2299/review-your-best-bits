DROP POLICY IF EXISTS "Anyone can create an order" ON public.orders;

CREATE POLICY "Anyone can create a valid order"
  ON public.orders FOR INSERT
  WITH CHECK (
    jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) > 0
    AND total >= 0
    AND status = 'pendiente'
  );