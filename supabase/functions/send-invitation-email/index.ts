import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, cache-control, pragma",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

interface InvitationRequest {
  email: string;
  inviteCode: string;
  role: string;
  companyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin") || "unknown";
  
  console.log(`=== MAILGUN INVITATION EMAIL FUNCTION ===`);
  console.log(`Method: ${req.method}`);
  console.log(`Origin: ${origin}`);
  console.log(`Referer: ${req.headers.get("referer")}`);
  console.log(`User-Agent: ${req.headers.get("user-agent")}`);
  console.log(`Authorization header present: ${!!req.headers.get("authorization")}`);
  console.log(`X-Client-Info header: ${req.headers.get("x-client-info")}`);
  console.log(`ApiKey header present: ${!!req.headers.get("apikey")}`);
  console.log(`Content-Type: ${req.headers.get("content-type")}`);
  console.log(`All headers:`, Object.fromEntries(req.headers.entries()));
  
  // Log environment variables (without secrets)
  console.log(`Environment check:`);
  console.log(`- MAILGUN_API_KEY: ${Deno.env.get("MAILGUN_API_KEY") ? 'SET' : 'NOT SET'}`);
  console.log(`- MAILGUN_DOMAIN: ${Deno.env.get("MAILGUN_DOMAIN") ? 'SET' : 'NOT SET'}`);

  // Enhanced CORS preflight handling
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request with enhanced headers");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    console.log(`Invalid method: ${req.method}`);
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log(`Request body received:`, JSON.stringify(requestBody, null, 2));
    
    const { email, inviteCode, role, companyId }: InvitationRequest = requestBody;

    if (!email || !inviteCode) {
      console.error(`Missing required fields - email: ${email}, inviteCode: ${inviteCode}`);
      return new Response(
        JSON.stringify({ error: "Email and invite code are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get Mailgun configuration
    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN");
    
    if (!mailgunApiKey || !mailgunDomain) {
      console.error('Missing Mailgun configuration:', {
        mailgunApiKey: !!mailgunApiKey,
        mailgunDomain: !!mailgunDomain
      });
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "Missing Mailgun configuration",
          user_message: "Email service not configured. Please contact support."
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Using Mailgun domain: ${mailgunDomain}`);
    
    // Determine the correct base URL for redirect
    const requestOrigin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    
    // Known valid domains (updated with correct project ID)
    const validDomains = [
      "https://qdpktyyvqejdpxiegooe.lovableproject.com",
      "https://payroll.dootsons.com",
      "http://localhost:3000",
      "https://localhost:3000"
    ];
    
    let baseUrl = "https://qdpktyyvqejdpxiegooe.lovableproject.com"; // default fallback
    
    // Try to determine the correct base URL from origin first
    console.log(`[send-invitation-email] Checking origin: ${requestOrigin}`);
    console.log(`[send-invitation-email] Valid domains:`, validDomains);
    
    if (requestOrigin && validDomains.includes(requestOrigin)) {
      baseUrl = requestOrigin;
      console.log(`[send-invitation-email] Origin matched exactly: ${baseUrl}`);
    } else if (referer) {
      // Try to extract from referer as fallback
      console.log(`[send-invitation-email] Trying referer: ${referer}`);
      try {
        const refererUrl = new URL(referer);
        const potentialOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        console.log(`[send-invitation-email] Extracted potential origin: ${potentialOrigin}`);
        if (validDomains.includes(potentialOrigin)) {
          baseUrl = potentialOrigin;
          console.log(`[send-invitation-email] Referer matched: ${baseUrl}`);
        }
      } catch (e) {
        console.log("[send-invitation-email] Could not parse referer URL:", referer, e);
      }
    }
    
    if (baseUrl === "https://qdpktyyvqejdpxiegooe.lovableproject.com") {
      console.log("[send-invitation-email] Using default fallback URL");
    }
    
    const acceptUrl = `${baseUrl}/accept-invitation?code=${inviteCode}`;
    
    console.log(`[send-invitation-email] Request origin: ${requestOrigin}`);
    console.log(`[send-invitation-email] Referer: ${referer}`);
    console.log(`[send-invitation-email] Selected base URL: ${baseUrl}`);
    console.log(`[send-invitation-email] Final acceptance URL: ${acceptUrl}`);

    // Create HTML email template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="padding: 40px;">
                                <h1 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">You're Invited!</h1>
                                <p style="color: #666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
                                    You have been invited to join our platform with the role of <strong>${role}</strong>.
                                </p>
                                <p style="color: #666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                                    Click the button below to accept your invitation and get started:
                                </p>
                                <table cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="background-color: #007bff; border-radius: 4px;">
                                            <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                                Accept Invitation
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #999; margin: 30px 0 0 0; font-size: 14px; line-height: 1.5;">
                                    Or copy and paste this link into your browser:<br>
                                    <a href="${acceptUrl}" style="color: #007bff; word-break: break-all;">${acceptUrl}</a>
                                </p>
                                <p style="color: #999; margin: 20px 0 0 0; font-size: 14px;">
                                    This invitation will expire in 7 days.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    // Prepare Mailgun API request
    const formData = new FormData();
    formData.append('from', `Company Invitations <noreply@${mailgunDomain}>`);
    formData.append('to', email.toLowerCase().trim());
    formData.append('subject', 'You\'ve been invited to join our platform');
    formData.append('html', htmlTemplate);
    formData.append('text', `You've been invited to join our platform with the role of ${role}. Click this link to accept: ${acceptUrl}`);

    console.log("Sending invitation email via Mailgun to:", email);
    
    // Send email via Mailgun API
    const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData
    });

    const mailgunResult = await mailgunResponse.json();
    
    if (!mailgunResponse.ok) {
      console.error("Mailgun API error:", mailgunResult);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send invitation email", 
          details: mailgunResult.message || "Unknown Mailgun error",
          user_message: "Failed to send invitation email. Please try again or contact support.",
          debug_info: {
            origin: requestOrigin,
            mailgunError: mailgunResult
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Invitation email sent successfully via Mailgun:", mailgunResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { 
          messageId: mailgunResult.id,
          provider: "mailgun"
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    console.error("Full error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        user_message: "Failed to send invitation email due to server error.",
        debug_info: {
          origin: req.headers.get("origin"),
          timestamp: new Date().toISOString()
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);