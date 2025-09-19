-- Fix the trigger function to create profile before company access
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invitation_meta public.invitation_metadata;
BEGIN
  -- Create profile first (existing logic)
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
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
$function$