-- Fix Function Search Path Mutable security warning
-- Add SET search_path to functions that are missing it

-- Fix prevent_disable_2fa function
CREATE OR REPLACE FUNCTION public.prevent_disable_2fa()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.is_2fa_enabled = false AND OLD.is_2fa_enabled = true THEN
    RAISE EXCEPTION 'Two-factor authentication cannot be disabled. It is mandatory for all users.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;