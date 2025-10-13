-- Add employee portal invitation tracking fields
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT false;

-- Create index for faster portal access lookups
CREATE INDEX IF NOT EXISTS idx_employees_portal_access ON public.employees(portal_access_enabled);

-- Update the handle_new_user_from_invitation trigger to support employee invitations
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invitation_meta public.invitation_metadata;
  employee_record public.employees;
BEGIN
  -- Create profile first with 2FA ENABLED by default (MANDATORY)
  INSERT INTO public.profiles (id, email, full_name, is_admin, is_2fa_enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    true  -- FORCE 2FA enabled for all new users
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Look for invitation metadata for this email
  SELECT * INTO invitation_meta 
  FROM public.invitation_metadata 
  WHERE invited_email = NEW.email 
  AND NOT is_accepted 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If invitation found, set up access
  IF invitation_meta.id IS NOT NULL THEN
    -- Create company access (now that profile exists)
    INSERT INTO public.company_access (user_id, company_id, role)
    VALUES (NEW.id, invitation_meta.company_id, invitation_meta.role)
    ON CONFLICT (user_id, company_id) 
    DO UPDATE SET role = EXCLUDED.role, updated_at = now();
    
    -- Mark invitation as accepted
    UPDATE public.invitation_metadata 
    SET is_accepted = true, accepted_at = now()
    WHERE id = invitation_meta.id;
    
    -- If this is an employee invitation, link the user to the employee record
    IF invitation_meta.role = 'employee' THEN
      -- Find the employee record with this email and company
      SELECT * INTO employee_record
      FROM public.employees
      WHERE email = NEW.email 
      AND company_id = invitation_meta.company_id
      LIMIT 1;
      
      -- Link user_id to employee record and enable portal access
      IF employee_record.id IS NOT NULL THEN
        UPDATE public.employees
        SET user_id = NEW.id,
            portal_access_enabled = true,
            updated_at = now()
        WHERE id = employee_record.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;