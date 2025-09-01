-- Create RPC function to accept invitations
CREATE OR REPLACE FUNCTION public.accept_invitation(_invite_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_record public.invitations;
  result jsonb;
BEGIN
  -- Find the invitation by invite code
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE invite_code = _invite_code 
  AND NOT is_accepted;
  
  -- Check if invitation exists
  IF invitation_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or already accepted invitation code'
    );
  END IF;
  
  -- Check if invitation has expired
  IF invitation_record.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invitation has expired'
    );
  END IF;
  
  -- Check if user email matches invitation email
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = _user_id 
    AND email = invitation_record.email
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invitation was sent to a different email address'
    );
  END IF;
  
  -- Mark invitation as accepted
  UPDATE public.invitations 
  SET 
    is_accepted = true,
    accepted_at = now()
  WHERE id = invitation_record.id;
  
  -- Create or update company access for the user
  INSERT INTO public.company_access (user_id, company_id, role)
  VALUES (_user_id, invitation_record.company_id, invitation_record.role)
  ON CONFLICT (user_id, company_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
  
  -- Return success with invitation details
  RETURN jsonb_build_object(
    'success', true,
    'invitation', jsonb_build_object(
      'email', invitation_record.email,
      'role', invitation_record.role,
      'company_id', invitation_record.company_id
    )
  );
END;
$$;