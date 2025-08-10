-- Create admin-gated RPCs for invitations to avoid RLS permission issues
-- These functions use security definer and check admin status via public.is_admin(user_id)

-- Get all invitations (admin only)
CREATE OR REPLACE FUNCTION public.get_invitations(_user_id uuid)
RETURNS SETOF public.invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(_user_id) THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT i.*
  FROM public.invitations i
  ORDER BY i.issued_at DESC;
END;
$$;

-- Create an invitation (admin only)
CREATE OR REPLACE FUNCTION public.create_invitation(
  _user_id uuid,
  _email text,
  _invite_code text,
  _role text DEFAULT 'user',
  _expires_at timestamptz
)
RETURNS public.invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_inv public.invitations;
BEGIN
  IF NOT public.is_admin(_user_id) THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.invitations (
    email,
    invite_code,
    issued_at,
    expires_at,
    is_accepted,
    accepted_at,
    role,
    issued_by
  ) VALUES (
    lower(trim(_email)),
    _invite_code,
    now(),
    _expires_at,
    false,
    NULL,
    COALESCE(_role, 'user'),
    _user_id
  )
  RETURNING * INTO new_inv;

  RETURN new_inv;
END;
$$;

-- Delete an invitation (admin only)
CREATE OR REPLACE FUNCTION public.delete_invitation(
  _user_id uuid,
  _id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted boolean := false;
BEGIN
  IF NOT public.is_admin(_user_id) THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.invitations WHERE id = _id;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;