import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendInvitationRequest {
  invitation_id: string;
}

function createInviteEmailHtml(inviteUrl: string, companyName: string, role: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: You're Invited to Join ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">Dootsons Payroll</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">Reminder: You've Been Invited</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #52525b;">
                This is a reminder that you have been invited to join <strong>${companyName}</strong> as a <strong>${role}</strong> on Dootsons Payroll.
              </p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #52525b;">
                Click the button below to accept your invitation and set up your account.
              </p>
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 18px; color: #a1a1aa; word-break: break-all;">
                ${inviteUrl}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #71717a; text-align: center;">
                This email was sent by Dootsons Payroll. If you have any questions, please contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function createInviteEmailText(inviteUrl: string, companyName: string, role: string): string {
  return `Reminder: You've Been Invited to Join ${companyName}

This is a reminder that you have been invited to join ${companyName} as a ${role} on Dootsons Payroll.

To accept your invitation and set up your account, visit:
${inviteUrl}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.

---
This email was sent by Dootsons Payroll.`;
}

async function sendMailgunEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  mailgunApiKey: string,
  mailgunDomain: string
): Promise<{ success: boolean; error?: string }> {
  const formData = new FormData();
  formData.append('from', `Dootsons Payroll <noreply@${mailgunDomain}>`);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('html', html);
  formData.append('text', text);
  formData.append('h:List-Unsubscribe', `<mailto:unsubscribe@${mailgunDomain}>`);

  const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: errorText };
  }

  return { success: true };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')!;
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')!;
    
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

    console.log(`[resend-invitation] Resending invitation ${invitation_id} for user ${user.id} via Mailgun`);

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

    // Fetch company name for email
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', invitation.company_id)
      .single();

    const companyName = company?.name || 'your organization';

    console.log(`[resend-invitation] Generating new link for ${invitation.invited_email}`);

    // Create initial log entry
    const { data: logEntry } = await supabaseAdmin
      .from('invitation_resend_log')
      .insert({
        invitation_id: invitation_id,
        resent_by: user.id,
        success: false,
        resend_method: 'mailgun',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    // Generate a new invitation link
    const redirectUrl = 'https://payroll.dootsons.com/auth';
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: invitation.invited_email,
      options: {
        redirectTo: redirectUrl,
        data: {
          company_id: invitation.company_id,
          role: invitation.role,
          invited_by: invitation.invited_by,
        }
      }
    });

    if (linkError) {
      console.error('[resend-invitation] Error generating link:', linkError);
      
      // Update log with failure
      if (logEntry) {
        await supabaseAdmin
          .from('invitation_resend_log')
          .update({
            success: false,
            error_message: linkError.message
          })
          .eq('id', logEntry.id);
      }
      
      throw new Error(`Failed to generate invitation link: ${linkError.message}`);
    }

    const inviteUrl = linkData.properties?.action_link || `${redirectUrl}?token=${invitation.token}`;

    console.log(`[resend-invitation] Sending email via Mailgun to ${invitation.invited_email}`);

    // Send email via Mailgun
    const emailHtml = createInviteEmailHtml(inviteUrl, companyName, invitation.role);
    const emailText = createInviteEmailText(inviteUrl, companyName, invitation.role);
    
    const mailResult = await sendMailgunEmail(
      invitation.invited_email,
      `Reminder: You've been invited to join ${companyName} on Dootsons Payroll`,
      emailHtml,
      emailText,
      mailgunApiKey,
      mailgunDomain
    );

    if (!mailResult.success) {
      console.error('[resend-invitation] Mailgun error:', mailResult.error);
      
      // Update log with failure
      if (logEntry) {
        await supabaseAdmin
          .from('invitation_resend_log')
          .update({
            success: false,
            error_message: mailResult.error
          })
          .eq('id', logEntry.id);
      }
      
      throw new Error(`Failed to send email via Mailgun: ${mailResult.error}`);
    }

    // Update log with success
    if (logEntry) {
      await supabaseAdmin
        .from('invitation_resend_log')
        .update({ success: true })
        .eq('id', logEntry.id);
    }

    console.log(`[resend-invitation] Email resent successfully via Mailgun to ${invitation.invited_email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation email resent successfully via Mailgun',
        email: invitation.invited_email,
        invite_url: inviteUrl,
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
