-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ TIMESTAMPS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PRODUCT FILTERS ============
CREATE TABLE public.product_filters (
  id TEXT NOT NULL PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Filters are viewable by everyone"
  ON public.product_filters FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert filters"
  ON public.product_filters FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update filters"
  ON public.product_filters FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete filters"
  ON public.product_filters FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_product_filters_updated_at
  BEFORE UPDATE ON public.product_filters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'all' REFERENCES public.product_filters(id) ON DELETE SET DEFAULT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CUP')),
  stock INTEGER NOT NULL DEFAULT 0,
  por_encargo BOOLEAN NOT NULL DEFAULT false,
  is_on_sale BOOLEAN NOT NULL DEFAULT false,
  discount_pct INTEGER NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 95),
  image_url TEXT,
  warranty TEXT,
  is_new BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_on_sale ON public.products(is_on_sale) WHERE is_on_sale = true;

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || upper(substr(gen_random_uuid()::text, 1, 8)),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'contactado', 'vendido', 'cancelado')),
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create an order"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- ============ APP SETTINGS (singleton) ============
CREATE TABLE public.app_settings (
  id BOOLEAN NOT NULL PRIMARY KEY DEFAULT true CHECK (id = true),
  whatsapp_number TEXT NOT NULL DEFAULT '5352996275',
  business_name TEXT NOT NULL DEFAULT 'Insignia',
  business_info TEXT NOT NULL DEFAULT 'Catálogo de electrodomésticos. Pedidos por WhatsApp.',
  business_address TEXT NOT NULL DEFAULT 'La Habana, Cuba',
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '18:00',
  open_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by everyone"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED ============
INSERT INTO public.product_filters (id, label, icon, sort_order) VALUES
  ('all', 'Todos', 'ph-squares-four', 0),
  ('ofertas', 'Ofertas', 'ph-tag', 1),
  ('refrigeracion', 'Refrigeración', 'ph-snowflake', 2),
  ('cocina', 'Cocina', 'ph-cooking-pot', 3),
  ('lavado', 'Lavado', 'ph-drop', 4),
  ('climatizacion', 'Climatización', 'ph-wind', 5),
  ('pequenos', 'Pequeños', 'ph-coffee', 6);

INSERT INTO public.app_settings (id) VALUES (true);

INSERT INTO public.products (name, description, category, price, currency, stock, image_url, is_new, is_on_sale, discount_pct, warranty, sort_order) VALUES
  ('Refrigerador Samsung 350L', 'No Frost, eficiencia A++. Compresor inverter para ahorro energético y bajo nivel de ruido.', 'refrigeracion', 850, 'USD', 5, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800', true, false, 0, '2 años de garantía', 1),
  ('Cocina de inducción 4 hornillas', 'Panel táctil, 8 niveles de potencia, temporizador y bloqueo de seguridad.', 'cocina', 420, 'USD', 8, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', false, true, 15, '1 año de garantía', 2),
  ('Lavadora automática 9kg', 'Carga frontal, 12 programas de lavado, motor inverter ultra silencioso.', 'lavado', 690, 'USD', 3, 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800', false, false, 0, '2 años de garantía', 3),
  ('Aire acondicionado split 12000 BTU', 'Frío/calor, inverter, función dormir y modo turbo.', 'climatizacion', 580, 'USD', 0, 'https://images.unsplash.com/photo-1631545806609-22c8c19b1c87?w=800', false, false, 0, '3 años en compresor', 4),
  ('Microondas digital 25L', '900W, 10 niveles de potencia, descongelado automático.', 'pequenos', 165, 'USD', 12, 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800', true, true, 10, '1 año de garantía', 5),
  ('Cafetera espresso automática', '15 bares, espumador de leche integrado, depósito 1.5L.', 'pequenos', 230, 'USD', 0, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', false, false, 0, '1 año de garantía', 6);

UPDATE public.products SET por_encargo = true WHERE stock = 0;