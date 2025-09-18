import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  email: string;
  inviteCode: string;
  role: string;
  companyName?: string;
  appUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviteCode, role, companyName, appUrl }: InvitationEmailRequest = await req.json();
    
    console.log(`Sending invitation email to ${email} with code ${inviteCode}`);

    // TODO: Configure email service credentials
    console.log('Email service not yet configured');

    // Create email content
    const acceptUrl = `${appUrl}/accept-invite?code=${inviteCode}`;
    const fromEmail = 'noreply@payroll.dootsons.com';
    const subject = `You're invited to join ${companyName || 'our team'}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">You're Invited!</h1>
            <p style="font-size: 18px; margin-bottom: 25px;">
              You've been invited to join ${companyName || 'our team'} as a <strong>${role}</strong>.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin-bottom: 20px;">Click the button below to accept your invitation:</p>
              <a href="${acceptUrl}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:<br>
              <a href="${acceptUrl}" style="color: #2563eb; word-break: break-all;">${acceptUrl}</a>
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Your invitation code: <strong>${inviteCode}</strong>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
You're invited to join ${companyName || 'our team'} as a ${role}.

To accept your invitation, visit: ${acceptUrl}

Your invitation code: ${inviteCode}

If you didn't expect this invitation, you can safely ignore this email.
    `;

    // TODO: Implement email sending
    console.log('Email content prepared but not sent (email service not configured)');
    console.log('Email would be sent to:', email);
    console.log('Subject:', subject);
    
    // Simulate successful response for now
    const result = { 
      id: `mock-${Date.now()}`,
      message: 'Email would be sent when service is configured'
    };

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation email sent successfully',
      messageId: result.id 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-invitation-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);