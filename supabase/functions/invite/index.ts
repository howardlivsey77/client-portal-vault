import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

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

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get('MAILGUN_SMTP_HOST') || 'smtp.mailgun.org';
    const smtpPort = parseInt(Deno.env.get('MAILGUN_SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('MAILGUN_SMTP_USER');
    const smtpPass = Deno.env.get('MAILGUN_SMTP_PASS');
    const fromEmail = Deno.env.get('INVITE_FROM_EMAIL') || 'no-reply@payroll.dootsons.com';

    console.log('SMTP Configuration:');
    console.log('- Host:', smtpHost);
    console.log('- Port:', smtpPort);
    console.log('- User:', smtpUser ? `${smtpUser.substring(0, 10)}...` : 'NOT SET');
    console.log('- Pass:', smtpPass ? 'SET' : 'NOT SET');
    console.log('- From Email:', fromEmail);

    if (!smtpUser || !smtpPass) {
      console.error('SMTP credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'SMTP credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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

    // Send email using SMTP
    const emailData = {
      from: fromEmail,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    // Create the SMTP message
    const boundary = `----boundary_${Date.now()}`;
    const smtpMessage = [
      `From: ${emailData.from}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      emailData.text,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      emailData.html,
      ``,
      `--${boundary}--`
    ].join('\r\n');

    console.log('=== ATTEMPTING SMTP CONNECTION ===');
    console.log('Connecting to:', `${smtpHost}:${smtpPort}`);
    
    // Connect to SMTP server with timeout
    const connectPromise = Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });
    
    const conn = await Promise.race([connectPromise, timeoutPromise]) as Deno.Conn;
    console.log('SMTP connection established');

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to send SMTP command and read response
    async function sendCommand(command: string): Promise<string> {
      console.log('SMTP Command:', command || '[INITIAL CONNECTION]');
      await conn.write(encoder.encode(command + '\r\n'));
      const buffer = new Uint8Array(1024);
      const bytesRead = await conn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, bytesRead || 0));
      console.log('SMTP Response:', response.trim());
      return response;
    }

    console.log('=== STARTING SMTP CONNECTION ===');
    
    try {
      // SMTP handshake
      console.log('Step 1: Initial connection...');
      const initialResponse = await sendCommand('');
      
      console.log('Step 2: EHLO handshake...');
      const ehloResponse = await sendCommand(`EHLO ${smtpHost}`);
      
      console.log('Step 3: Starting TLS...');
      const startTlsResponse = await sendCommand('STARTTLS');
      
      console.log('Step 4: Upgrading to TLS connection...');
      // Upgrade to TLS connection
      const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });
      conn.close();
      console.log('TLS upgrade successful');
      
      // Continue with TLS connection
      async function sendTlsCommand(command: string): Promise<string> {
        console.log('TLS Command:', command);
        await tlsConn.write(encoder.encode(command + '\r\n'));
        const buffer = new Uint8Array(1024);
        const bytesRead = await tlsConn.read(buffer);
        const response = decoder.decode(buffer.subarray(0, bytesRead || 0));
        console.log('TLS Response:', response.trim());
        return response;
      }

      console.log('Step 5: TLS EHLO...');
      const tlsEhloResponse = await sendTlsCommand(`EHLO ${smtpHost}`);
      
      console.log('Step 6: Authentication...');
      const authResponse = await sendTlsCommand('AUTH LOGIN');
      const userResponse = await sendTlsCommand(btoa(smtpUser));
      const passResponse = await sendTlsCommand(btoa(smtpPass));
      
      console.log('Step 7: Setting sender...');
      const mailFromResponse = await sendTlsCommand(`MAIL FROM:<${emailData.from}>`);
      
      console.log('Step 8: Setting recipient...');
      const rcptToResponse = await sendTlsCommand(`RCPT TO:<${emailData.to}>`);
      
      console.log('Step 9: Starting data transmission...');
      const dataResponse = await sendTlsCommand('DATA');
      
      console.log('Step 10: Sending email content...');
      const messageResponse = await sendTlsCommand(smtpMessage + '\r\n.');
      
      console.log('Step 11: Closing connection...');
      const quitResponse = await sendTlsCommand('QUIT');
      
      tlsConn.close();
      console.log('=== SMTP CONNECTION COMPLETED SUCCESSFULLY ===');

      console.log(`Invitation email sent successfully to: ${email}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Invitation email sent to ${email}` 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );

    } catch (smtpError) {
      console.error('=== SMTP ERROR OCCURRED ===');
      console.error('Error type:', smtpError.constructor.name);
      console.error('Error message:', smtpError.message);
      console.error('Error stack:', smtpError.stack);
      
      try {
        conn.close();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
      
      // Provide more specific error messages
      let errorMessage = `SMTP Error: ${smtpError.message}`;
      if (smtpError.message.includes('timeout')) {
        errorMessage = 'Email sending timed out - please check SMTP server availability';
      } else if (smtpError.message.includes('authentication')) {
        errorMessage = 'SMTP authentication failed - please check credentials';
      } else if (smtpError.message.includes('connection')) {
        errorMessage = 'Failed to connect to SMTP server - please check server settings';
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          debug: {
            smtp_host: smtpHost,
            smtp_port: smtpPort,
            smtp_user: smtpUser ? 'configured' : 'missing',
            error_type: smtpError.constructor.name
          }
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