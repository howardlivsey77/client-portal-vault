-- Make 2FA mandatory for all users

-- 1. Update the trigger function to set is_2fa_enabled = true for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invitation_meta public.invitation_metadata;
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
  
  -- Then look for invitation metadata for this email
  SELECT * INTO invitation_meta 
  FROM public.invitation_metadata 
  WHERE invited_email = NEW.email 
  AND NOT is_accepted 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If invitation found, set up company access and mark as accepted
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
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Set is_2fa_enabled = true for ALL existing users
UPDATE public.profiles
SET is_2fa_enabled = true
WHERE is_2fa_enabled = false;

-- 3. Create a trigger to prevent disabling 2FA (database-level protection)
CREATE OR REPLACE FUNCTION public.prevent_disable_2fa()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_2fa_enabled = false AND OLD.is_2fa_enabled = true THEN
    RAISE EXCEPTION 'Two-factor authentication cannot be disabled. It is mandatory for all users.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS enforce_2fa_mandatory ON public.profiles;
CREATE TRIGGER enforce_2fa_mandatory
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_disable_2fa();