import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  email: string;
  inviteCode: string;
  role?: string;
  appUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { email, inviteCode, role, appUrl }: InvitePayload = await req.json();

    if (!email || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, inviteCode" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const acceptUrl = `${appUrl ?? ''}/accept-invite?code=${inviteCode}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; color: #333;">
        <h1 style="font-size:20px; margin:0 0 16px;">You're invited!</h1>
        <p>You've been invited to join our platform${role ? ` as a <strong>${role}</strong>` : ''}.</p>
        <p>Click the button below to accept your invite:</p>
        <p>
          <a href="${acceptUrl}" target="_blank" style="display:inline-block; background:#111; color:#fff; padding:10px 16px; text-decoration:none; border-radius:6px;">
            Accept Invitation
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this code during signup:</p>
        <code style="display:inline-block; padding:10px 12px; background:#f4f4f4; border:1px solid #e5e5e5; border-radius:6px;">${inviteCode}</code>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "Invites <onboarding@resend.dev>",
      to: [email],
      subject: "You're invited to join",
      html,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-invite error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
