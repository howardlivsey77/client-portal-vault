import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendInvitationRequest {
  invitation_id: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { invitation_id }: ResendInvitationRequest = await req.json();

    if (!invitation_id) {
      throw new Error('invitation_id is required');
    }

    console.log(`[resend-invitation] Resending invitation ${invitation_id} for user ${user.id}`);

    // Fetch the invitation metadata
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitation_metadata')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invitation not found');
    }

    // Check if invitation is already accepted
    if (invitation.is_accepted) {
      throw new Error('This invitation has already been accepted');
    }

    // Verify the user has permission (is admin or has company access)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_admin || false;

    if (!isAdmin) {
      // Check if user has company access
      const { data: access } = await supabaseAdmin
        .from('company_access')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', invitation.company_id)
        .single();

      if (!access || access.role !== 'admin') {
        throw new Error('Permission denied: You must be an admin to resend invitations');
      }
    }

    console.log(`[resend-invitation] Resending email to ${invitation.invited_email}`);

    // Create initial log entry
    const { data: logEntry } = await supabaseAdmin
      .from('invitation_resend_log')
      .insert({
        invitation_id: invitation_id,
        resent_by: user.id,
        success: false,
        resend_method: 'manual',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    // Resend the invitation email via Supabase Auth
    const redirectTo = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.supabase.co')}/auth/v1/verify?token=${invitation.token}&type=invite&redirect_to=https://payroll.dootsons.com/auth`;

    const { data: resendData, error: resendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      invitation.invited_email,
      {
        data: {
          company_id: invitation.company_id,
          role: invitation.role,
          invited_by: invitation.invited_by,
        },
        redirectTo: redirectTo,
      }
    );

    if (resendError) {
      console.error('[resend-invitation] Error resending email:', resendError);
      
      // Update log with failure
      if (logEntry) {
        await supabaseAdmin
          .from('invitation_resend_log')
          .update({
            success: false,
            error_message: resendError.message
          })
          .eq('id', logEntry.id);
      }
      
      throw new Error(`Failed to resend invitation: ${resendError.message}`);
    }

    // Update log with success
    if (logEntry) {
      await supabaseAdmin
        .from('invitation_resend_log')
        .update({ success: true })
        .eq('id', logEntry.id);
    }

    console.log(`[resend-invitation] Email resent successfully to ${invitation.invited_email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation email resent successfully',
        email: invitation.invited_email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[resend-invitation] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while resending the invitation',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
