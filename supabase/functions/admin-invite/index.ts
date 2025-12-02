import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')!;
const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InviteRequest {
  email: string;
  company_id: string;
  role: string;
  redirect_to?: string;
  origin?: string;
}

function createInviteEmailHtml(inviteUrl: string, companyName: string, role: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${companyName}</title>
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
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">You've Been Invited</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #52525b;">
                You have been invited to join <strong>${companyName}</strong> as a <strong>${role}</strong> on Dootsons Payroll.
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
  return `You've Been Invited to Join ${companyName}

You have been invited to join ${companyName} as a ${role} on Dootsons Payroll.

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
  text: string
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const reqId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Get the user's JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's token for auth validation
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin permissions
    const { data: hasAccess, error: accessError } = await supabaseUser
      .rpc('user_has_company_access', { 
        _user_id: user.id, 
        _company_id: null, 
        _required_role: 'admin' 
      });

    if (accessError) {
      console.error('Error checking access:', accessError);
      throw new Error('Access check failed');
    }

    const { data: isAdmin, error: adminError } = await supabaseUser
      .rpc('is_admin', { user_id: user.id });

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      throw new Error('Admin check failed');
    }

    if (!isAdmin && !hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const { email, company_id, role, redirect_to, origin }: InviteRequest = await req.json();

    console.log(JSON.stringify({ 
      evt: "invite.start", 
      reqId, 
      email: email?.toLowerCase()?.trim(), 
      role, 
      company_id,
      emailProvider: "mailgun",
      timestamp: new Date().toISOString()
    }));

    if (!email || !company_id || !role) {
      throw new Error('Missing required fields: email, company_id, role');
    }

    // Fetch company name for email
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', company_id)
      .single();

    const companyName = company?.name || 'your organization';

    // Check if user already exists in auth.users
    console.log(JSON.stringify({
      evt: "invite.check_existing_user",
      reqId,
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString()
    }));

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (existingUser) {
      console.log(JSON.stringify({
        evt: "invite.existing_user_found",
        reqId,
        email: email.toLowerCase().trim(),
        user_id: existingUser.id,
        timestamp: new Date().toISOString()
      }));

      // Check if they already have company_access
      const { data: existingAccess, error: accessCheckError } = await supabaseAdmin
        .from('company_access')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('company_id', company_id)
        .single();

      if (existingAccess) {
        throw new Error('User already has access to this company');
      }

      // Add company_access directly for existing user
      const { error: accessError } = await supabaseAdmin
        .from('company_access')
        .insert({
          user_id: existingUser.id,
          company_id: company_id,
          role: role
        });

      if (accessError) {
        console.error(JSON.stringify({
          evt: "invite.existing_user_access_error",
          reqId,
          email: email.toLowerCase().trim(),
          error: accessError,
          timestamp: new Date().toISOString()
        }));
        throw new Error(`Failed to add existing user to company: ${accessError.message}`);
      }

      const duration = Date.now() - startTime;

      console.log(JSON.stringify({
        evt: "invite.existing_user_added",
        reqId,
        email: email.toLowerCase().trim(),
        company_id,
        role,
        user_id: existingUser.id,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }));

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Existing user added to company',
          user_id: existingUser.id,
          existing_user: true,
          duration_ms: duration
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // User doesn't exist - proceed with invitation flow
    // Store invitation metadata first
    console.log(JSON.stringify({
      evt: "invite.metadata_insert_attempt",
      reqId,
      email: email.toLowerCase().trim(),
      company_id,
      role,
      timestamp: new Date().toISOString()
    }));

    const { data: metadataResult, error: metadataError } = await supabaseAdmin
      .from('invitation_metadata')
      .insert({
        invited_email: email.toLowerCase().trim(),
        invited_by: user.id,
        company_id: company_id,
        role: role
      })
      .select()
      .single();

    if (metadataError) {
      console.error(JSON.stringify({
        evt: "invite.metadata_error",
        reqId,
        email: email.toLowerCase().trim(),
        error: metadataError,
        errorCode: metadataError.code,
        errorMessage: metadataError.message,
        errorDetails: metadataError.details,
        errorHint: metadataError.hint,
        timestamp: new Date().toISOString()
      }));
      if (metadataError.code === '23505') {
        throw new Error('User already has an active invitation for this company');
      }
      throw new Error(`Failed to create invitation metadata: ${metadataError.message} (Code: ${metadataError.code})`);
    }

    console.log(JSON.stringify({
      evt: "invite.metadata_created",
      reqId,
      email: email.toLowerCase().trim(),
      invitation_id: metadataResult.id,
      timestamp: new Date().toISOString()
    }));

    // Create user without sending email (using generateLink to get invitation URL)
    const redirectUrl = redirect_to || `${origin || 'https://payroll.dootsons.com'}/auth`;
    
    console.log(JSON.stringify({
      evt: "invite.create_user_start",
      reqId,
      email: email.toLowerCase().trim(),
      redirectUrl,
      timestamp: new Date().toISOString()
    }));

    // Generate invitation link using Supabase
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email.toLowerCase().trim(),
      options: {
        redirectTo: redirectUrl,
        data: {
          company_id: company_id,
          role: role,
          invited_by: user.id,
          must_set_password: true
        }
      }
    });

    if (linkError) {
      console.error(JSON.stringify({
        evt: "invite.generate_link_error",
        reqId,
        email: email.toLowerCase().trim(),
        error: linkError,
        errorMessage: linkError.message,
        timestamp: new Date().toISOString()
      }));
      
      // Clean up metadata if link generation failed
      await supabaseAdmin
        .from('invitation_metadata')
        .delete()
        .eq('id', metadataResult.id);
        
      throw new Error(`Failed to generate invitation link: ${linkError.message}`);
    }

    // The invitation URL from Supabase
    const inviteUrl = linkData.properties?.action_link || `${redirectUrl}?token=${metadataResult.token}`;

    console.log(JSON.stringify({
      evt: "invite.link_generated",
      reqId,
      email: email.toLowerCase().trim(),
      hasActionLink: !!linkData.properties?.action_link,
      timestamp: new Date().toISOString()
    }));

    // Send custom email via Mailgun
    console.log(JSON.stringify({
      evt: "invite.mailgun_send_start",
      reqId,
      email: email.toLowerCase().trim(),
      mailgunDomain,
      timestamp: new Date().toISOString()
    }));

    const emailHtml = createInviteEmailHtml(inviteUrl, companyName, role);
    const emailText = createInviteEmailText(inviteUrl, companyName, role);
    
    const mailResult = await sendMailgunEmail(
      email.toLowerCase().trim(),
      `You've been invited to join ${companyName} on Dootsons Payroll`,
      emailHtml,
      emailText
    );

    if (!mailResult.success) {
      console.error(JSON.stringify({
        evt: "invite.mailgun_error",
        reqId,
        email: email.toLowerCase().trim(),
        error: mailResult.error,
        timestamp: new Date().toISOString()
      }));
      
      // Don't delete metadata - user was created, just email failed
      // Return success but note email failure
      const duration = Date.now() - startTime;
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User created but email delivery may have failed. You can share the invite URL directly.',
          invitation_id: metadataResult.id,
          user_id: linkData.user?.id,
          invite_url: inviteUrl,
          email_sent: false,
          email_error: mailResult.error,
          duration_ms: duration
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const duration = Date.now() - startTime;
    
    console.log(JSON.stringify({
      evt: "invite.success",
      reqId,
      email: email.toLowerCase().trim(),
      company_id,
      role,
      invitation_id: metadataResult.id,
      user_id: linkData.user?.id,
      duration_ms: duration,
      emailProvider: "mailgun",
      timestamp: new Date().toISOString()
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully via Mailgun',
        invitation_id: metadataResult.id,
        user_id: linkData.user?.id,
        invite_url: inviteUrl,
        email_sent: true,
        duration_ms: duration
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(JSON.stringify({
      evt: "invite.error",
      reqId,
      message: error?.message || "Unknown error",
      code: error?.code,
      detail: error?.response?.data ?? error?.stack,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }));
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        request_id: reqId
      }),
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
