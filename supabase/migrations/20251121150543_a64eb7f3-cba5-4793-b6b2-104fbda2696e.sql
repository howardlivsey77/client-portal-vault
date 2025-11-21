-- Create invitation resend log table for audit tracking
CREATE TABLE public.invitation_resend_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.invitation_metadata(id) ON DELETE CASCADE,
  resent_by uuid NOT NULL,
  resent_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  error_message text,
  ip_address inet,
  user_agent text,
  resend_method text DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_invitation_resend_log_invitation_id ON public.invitation_resend_log(invitation_id);
CREATE INDEX idx_invitation_resend_log_resent_by ON public.invitation_resend_log(resent_by);
CREATE INDEX idx_invitation_resend_log_resent_at ON public.invitation_resend_log(resent_at DESC);

-- Enable RLS
ALTER TABLE public.invitation_resend_log ENABLE ROW LEVEL SECURITY;

-- Admins and company admins can view resend logs
CREATE POLICY "Admins can view resend logs"
  ON public.invitation_resend_log 
  FOR SELECT
  USING (
    is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.invitation_metadata im
      WHERE im.id = invitation_resend_log.invitation_id
      AND user_has_company_access(auth.uid(), im.company_id, 'admin')
    )
  );

-- Allow service role to insert logs (edge functions use service role)
CREATE POLICY "Service role can insert resend logs"
  ON public.invitation_resend_log 
  FOR INSERT
  WITH CHECK (true);