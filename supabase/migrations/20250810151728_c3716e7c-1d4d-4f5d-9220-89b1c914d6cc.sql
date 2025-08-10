-- 1) Add company_id to invitations and FK
ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS company_id uuid;

ALTER TABLE public.invitations
ADD CONSTRAINT IF NOT EXISTS invitations_company_id_fkey
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2) Replace RPCs to include company checks
-- Helper note: We use existing public.is_admin and user_has_company_access(user, company, 'admin')

-- Get invitations: optionally filter by company; non-super admins only see companies where they are admin
CREATE OR REPLACE FUNCTION public.get_invitations(
  _user_id uuid,
  _company_id uuid DEFAULT NULL
)
RETURNS SETOF public.invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _company_id IS NOT NULL THEN
    IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, _company_id, 'admin')) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT i.*
    FROM public.invitations i
    WHERE i.company_id = _company_id
    ORDER BY i.issued_at DESC;
  ELSE
    IF public.is_admin(_user_id) THEN
      RETURN QUERY
      SELECT i.* FROM public.invitations i
      ORDER BY i.issued_at DESC;
    ELSE
      RETURN QUERY
      SELECT i.*
      FROM public.invitations i
      WHERE i.company_id IN (
        SELECT ca.company_id FROM public.company_access ca
        WHERE ca.user_id = _user_id AND ca.role = 'admin'
      )
      ORDER BY i.issued_at DESC;
    END IF;
  END IF;
END;
$$;

-- Create invitation for a specific company (company admin or super admin)
CREATE OR REPLACE FUNCTION public.create_invitation(
  _user_id uuid,
  _email text,
  _invite_code text,
  _company_id uuid,
  _expires_at timestamptz DEFAULT (now() + interval '7 days'),
  _role text DEFAULT 'user'
)
RETURNS public.invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_inv public.invitations;
BEGIN
  IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, _company_id, 'admin')) THEN
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
    issued_by,
    company_id
  ) VALUES (
    lower(trim(_email)),
    _invite_code,
    now(),
    _expires_at,
    false,
    NULL,
    COALESCE(_role, 'user'),
    _user_id,
    _company_id
  )
  RETURNING * INTO new_inv;

  RETURN new_inv;
END;
$$;

-- Delete invitation with company check
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
  inv_company uuid;
BEGIN
  SELECT company_id INTO inv_company FROM public.invitations WHERE id = _id;
  IF inv_company IS NULL THEN
    -- Fallback to super admin requirement if company not set (legacy rows)
    IF NOT public.is_admin(_user_id) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, inv_company, 'admin')) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
  END IF;

  DELETE FROM public.invitations WHERE id = _id;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;