-- Add token field to invitation_metadata for secure invite links
ALTER TABLE public.invitation_metadata 
ADD COLUMN token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Create index for fast token lookups
CREATE INDEX idx_invitation_metadata_token ON public.invitation_metadata(token);

-- Update existing records to have tokens
UPDATE public.invitation_metadata 
SET token = gen_random_uuid()::text 
WHERE token IS NULL;