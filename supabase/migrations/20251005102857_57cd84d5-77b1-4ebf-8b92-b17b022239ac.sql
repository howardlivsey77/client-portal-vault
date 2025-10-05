-- Create auth_codes table for email-based 2FA
CREATE TABLE public.auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  ip_address inet,
  user_agent text
);

CREATE INDEX idx_auth_codes_user_id ON public.auth_codes(user_id);
CREATE INDEX idx_auth_codes_code ON public.auth_codes(code);
CREATE INDEX idx_auth_codes_expires_at ON public.auth_codes(expires_at);

-- Enable RLS
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own auth codes
CREATE POLICY "Users can view their own auth codes"
  ON public.auth_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Add is_2fa_enabled to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_2fa_enabled boolean NOT NULL DEFAULT false;