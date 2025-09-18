import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  inviteCode: string;
  role: string;
  companyName: string;
  companyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviteCode, role, companyName }: InvitationRequest = await req.json();
    
    console.log("Direct email sending attempt:", { email, role, companyName });

    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "mail.dootsons.com";

    if (!mailgunApiKey) {
      throw new Error("MAILGUN_API_KEY not configured");
    }

    const inviteUrl = `https://payroll.dootsons.com/accept-invitation?code=${inviteCode}`;

    const formData = new FormData();
    formData.append("from", `Dootsons Payroll <no-reply@${mailgunDomain}>`);
    formData.append("to", email);
    formData.append("subject", `Invitation to join ${companyName}`);
    formData.append("html", `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">You've been invited to join ${companyName}</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          You have been invited to join as a <strong>${role}</strong>.
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Click the button below to accept your invitation:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
          Or copy and paste this link into your browser:<br>
          <a href="${inviteUrl}" style="color: #007bff; word-break: break-all;">${inviteUrl}</a>
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          This invitation will expire in 7 days. If you have any questions, please contact your administrator.
        </p>
      </div>
    `);

    const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text();
      console.error("Mailgun API error:", errorText);
      throw new Error(`Mailgun API failed: ${mailgunResponse.status} ${errorText}`);
    }

    const result = await mailgunResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email-direct function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        user_message: "Failed to send invitation email. Please try the manual copy-paste option."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);