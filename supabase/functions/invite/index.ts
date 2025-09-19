import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  email: string;
  invite_link: string;
  name?: string;
  from_name?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== INVITE FUNCTION START ===');
  console.log('Request method:', req.method);

  try {
    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { email, invite_link, name, from_name = "Dootsons Payroll", message }: InviteRequest = requestBody;

    // Validate required fields
    if (!email || !invite_link) {
      console.error('Validation failed: Missing required fields', { email: !!email, invite_link: !!invite_link });
      return new Response(
        JSON.stringify({ success: false, error: 'Email and invite_link are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Validation passed for:', email);

    // Check if sending is disabled for testing
    if (Deno.env.get('INVITE_DISABLE_SEND') === 'true') {
      console.log(`Email sending disabled. Would send to: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Email sending disabled (test mode)' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log("Using Resend API for email delivery");

    // Create email content
    const recipientName = name || email.split('@')[0];
    const subject = `Invitation to join ${from_name}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to ${from_name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 0; text-align: center;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="color: #333333; margin-bottom: 30px; text-align: center;">You're Invited!</h1>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                                Hello ${recipientName},
                            </p>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                                You've been invited to join <strong>${from_name}</strong>. Click the button below to accept your invitation and get started.
                            </p>
                            
                            ${message ? `
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                                <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">
                                    "${message}"
                                </p>
                            </div>
                            ` : ''}
                            
                            <div style="text-align: center; margin-bottom: 30px;">
                                <a href="${invite_link}" 
                                   style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold;">
                                    Accept Invitation
                                </a>
                            </div>
                            
                            <p style="color: #999999; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="${invite_link}" style="color: #007bff; word-break: break-all;">${invite_link}</a>
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
                                This invitation was sent by ${from_name}. If you weren't expecting this email, you can safely ignore it.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    const textContent = `
You're Invited to ${from_name}!

Hello ${recipientName},

You've been invited to join ${from_name}. Click the link below to accept your invitation and get started.

${message ? `Message: "${message}"` : ''}

Accept your invitation: ${invite_link}

If you weren't expecting this email, you can safely ignore it.

---
${from_name}
    `;

    console.log("Sending email via Resend...");

    try {
      const emailResponse = await resend.emails.send({
        from: `${from_name} <noreply@resend.dev>`,
        to: [email],
        subject: subject,
        html: htmlContent,
        text: textContent,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Invitation email sent to ${email}`,
          id: emailResponse.data?.id
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } catch (emailError) {
      console.error("Resend Email Error:", emailError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${emailError.message}` 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

  } catch (error: any) {
    console.error('Error in invite function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);