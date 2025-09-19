-- Create invitation metadata table to store additional invitation data
CREATE TABLE public.invitation_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  is_accepted boolean NOT NULL DEFAULT false,
  UNIQUE(invited_email, company_id)
);

-- Enable RLS
ALTER TABLE public.invitation_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitation metadata
CREATE POLICY "Admins can view invitation metadata" 
ON public.invitation_metadata 
FOR SELECT 
USING (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

CREATE POLICY "Admins can create invitation metadata" 
ON public.invitation_metadata 
FOR INSERT 
WITH CHECK (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

CREATE POLICY "Admins can update invitation metadata" 
ON public.invitation_metadata 
FOR UPDATE 
USING (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

CREATE POLICY "Admins can delete invitation metadata" 
ON public.invitation_metadata 
FOR DELETE 
USING (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

-- Function to handle new user signup from invitation
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_meta public.invitation_metadata;
BEGIN
  -- Look for invitation metadata for this email
  SELECT * INTO invitation_meta 
  FROM public.invitation_metadata 
  WHERE invited_email = NEW.email 
  AND NOT is_accepted 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If invitation found, set up company access and mark as accepted
  IF invitation_meta.id IS NOT NULL THEN
    -- Create company access
    INSERT INTO public.company_access (user_id, company_id, role)
    VALUES (NEW.id, invitation_meta.company_id, invitation_meta.role)
    ON CONFLICT (user_id, company_id) 
    DO UPDATE SET role = EXCLUDED.role, updated_at = now();
    
    -- Mark invitation as accepted
    UPDATE public.invitation_metadata 
    SET is_accepted = true, accepted_at = now()
    WHERE id = invitation_meta.id;
  END IF;
  
  -- Create profile (existing logic)
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_from_invitation();

-- Function to get invitation metadata (replaces get_invitations)
CREATE OR REPLACE FUNCTION public.get_invitation_metadata(_user_id uuid, _company_id uuid DEFAULT NULL::uuid)
RETURNS SETOF invitation_metadata
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _company_id IS NOT NULL THEN
    IF NOT (public.is_admin(_user_id) OR public.user_has_company_access(_user_id, _company_id, 'admin')) THEN
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
        WHERE ca.user_id = _user_id AND ca.role = 'admin'
      )
      ORDER BY i.created_at DESC;
    END IF;
  END IF;
END;
$$;