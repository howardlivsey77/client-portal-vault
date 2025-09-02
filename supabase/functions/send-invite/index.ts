import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FROM = Deno.env.get("RESEND_FROM") || "Invites <onboarding@resend.dev>";

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
    let raw: any = null;
    try {
      raw = await req.json();
    } catch (e) {
      console.error("send-invite: invalid JSON body", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payloadKeys = raw && typeof raw === "object" ? Object.keys(raw) : [];
    console.log("send-invite: received payload keys:", payloadKeys);

    // Normalize keys: support camelCase and snake_case
    const email = raw?.email ?? raw?.Email ?? raw?.email_address ?? raw?.emailAddress;
    const inviteCode = raw?.inviteCode ?? raw?.invite_code;
    const role = raw?.role ?? raw?.Role ?? undefined;
    const appUrl = raw?.appUrl ?? raw?.app_url ?? undefined;

    const missing: string[] = [];
    if (!email) missing.push("email");
    if (!inviteCode) missing.push("inviteCode");

    if (missing.length) {
      return new Response(
        JSON.stringify({
          error: `Missing required field(s): ${missing.join(", ")}`,
          receivedKeys: payloadKeys
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const base = appUrl ? String(appUrl).replace(/\/+$\/, "") : "";
    const acceptUrl = `${base}${base ? "" : ""}/accept-invite?code=${encodeURIComponent(inviteCode)}`;

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
      from: FROM,
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
