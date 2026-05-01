-- Create public bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Product images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Admins can insert
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));