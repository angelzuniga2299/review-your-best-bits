CREATE OR REPLACE FUNCTION public.list_users_for_admin()
RETURNS TABLE (user_id UUID, email TEXT, is_admin BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') AS is_admin,
    u.created_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_users_for_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_users_for_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.promote_to_admin(_target UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_to_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_admin(_target UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _target = auth.uid() THEN
    RAISE EXCEPTION 'No puedes quitarte tu propio rol admin';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target AND role = 'admin';

  SELECT COUNT(*) INTO remaining FROM public.user_roles WHERE role = 'admin';
  IF remaining = 0 THEN
    RAISE EXCEPTION 'Debe quedar al menos un admin';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_admin(UUID) TO authenticated;