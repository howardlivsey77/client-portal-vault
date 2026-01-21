-- Update RLS policies for invitation_metadata to allow bureau users
DROP POLICY IF EXISTS "Admins can view invitation metadata" ON public.invitation_metadata;
DROP POLICY IF EXISTS "Admins can create invitation metadata" ON public.invitation_metadata;
DROP POLICY IF EXISTS "Admins can update invitation metadata" ON public.invitation_metadata;
DROP POLICY IF EXISTS "Admins can delete invitation metadata" ON public.invitation_metadata;

CREATE POLICY "Admins and bureau can view invitation metadata"
ON public.invitation_metadata FOR SELECT
USING (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

CREATE POLICY "Admins and bureau can create invitation metadata"
ON public.invitation_metadata FOR INSERT
WITH CHECK (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

CREATE POLICY "Admins and bureau can update invitation metadata"
ON public.invitation_metadata FOR UPDATE
USING (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

CREATE POLICY "Admins and bureau can delete invitation metadata"
ON public.invitation_metadata FOR DELETE
USING (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

-- Update RLS policies for invitations table to allow bureau users
DROP POLICY IF EXISTS "Admins can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;

CREATE POLICY "Admins and bureau can view invitations"
ON public.invitations FOR SELECT
USING (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

CREATE POLICY "Admins and bureau can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

CREATE POLICY "Admins and bureau can update invitations"
ON public.invitations FOR UPDATE
USING (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

CREATE POLICY "Admins and bureau can delete invitations"
ON public.invitations FOR DELETE
USING (
  public.is_admin(auth.uid()) OR 
  public.user_has_company_access(auth.uid(), company_id, 'admin') OR
  public.user_has_company_access(auth.uid(), company_id, 'bureau')
);

-- Update the get_invitation_metadata function to include bureau role
CREATE OR REPLACE FUNCTION public.get_invitation_metadata(_user_id uuid, _company_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF invitation_metadata
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _company_id IS NOT NULL THEN
    IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, _company_id, 'admin') OR public.user_has_company_access(_user_id, _company_id, 'bureau')) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT i.*
    FROM public.invitation_metadata i
    WHERE i.company_id = _company_id
    ORDER BY i.created_at DESC;
  ELSE
    IF public.is_admin(_user_id) THEN
      RETURN QUERY
      SELECT i.* FROM public.invitation_metadata i
      ORDER BY i.created_at DESC;
    ELSE
      RETURN QUERY
      SELECT i.*
      FROM public.invitation_metadata i
      WHERE i.company_id IN (
        SELECT ca.company_id FROM public.company_access ca
        WHERE ca.user_id = _user_id AND ca.role IN ('admin', 'bureau')
      )
      ORDER BY i.created_at DESC;
    END IF;
  END IF;
END;
$function$;

-- Update the get_invitations function to include bureau role
CREATE OR REPLACE FUNCTION public.get_invitations(_user_id uuid, _company_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF invitations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _company_id IS NOT NULL THEN
    IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, _company_id, 'admin') OR public.user_has_company_access(_user_id, _company_id, 'bureau')) THEN
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
        WHERE ca.user_id = _user_id AND ca.role IN ('admin', 'bureau')
      )
      ORDER BY i.issued_at DESC;
    END IF;
  END IF;
END;
$function$;

-- Update create_invitation function to allow bureau users
CREATE OR REPLACE FUNCTION public.create_invitation(_user_id uuid, _email text, _invite_code text, _company_id uuid, _expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval), _role text DEFAULT 'user'::text)
 RETURNS invitations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_inv public.invitations;
BEGIN
  IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, _company_id, 'admin') OR public.user_has_company_access(_user_id, _company_id, 'bureau')) THEN
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
$function$;

-- Update delete_invitation function to allow bureau users
CREATE OR REPLACE FUNCTION public.delete_invitation(_user_id uuid, _id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted boolean := false;
  inv_company uuid;
BEGIN
  SELECT company_id INTO inv_company FROM public.invitations WHERE id = _id;
  IF inv_company IS NULL THEN
    IF NOT public.is_admin(_user_id) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, inv_company, 'admin') OR public.user_has_company_access(_user_id, inv_company, 'bureau')) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
  END IF;

  DELETE FROM public.invitations WHERE id = _id;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$function$;