import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Resolve and validate FROM address and API key
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mailboxRegex = /^([^<>]+)\s*<([^<>]+)>$/;

function resolveFrom(raw: string | null): { from: string; usedDefault: boolean; reason?: string } {
  const fallback = "Invites <onboarding@resend.dev>";
  if (!raw || !raw.trim()) {
    return { from: fallback, usedDefault: true, reason: "missing RESEND_FROM" };
  }
  const v = raw.trim();
  const mailboxMatch = v.match(mailboxRegex);
  if (mailboxMatch) {
    const email = mailboxMatch[2].trim();
    if (emailRegex.test(email)) return { from: v, usedDefault: false };
    return { from: fallback, usedDefault: true, reason: "invalid email in mailbox format" };
  }
  if (emailRegex.test(v)) {
    return { from: `Invites <${v}>`, usedDefault: false };
  }
  return { from: fallback, usedDefault: true, reason: "invalid format" };
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_INFO = resolveFrom(Deno.env.get("RESEND_FROM"));
const FROM = FROM_INFO.from;

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
      const contentType = req.headers.get("content-type") || "";
      let rawText = "";
      try {
        rawText = await req.text();
      } catch (e) {
        console.error("send-invite: error reading body as text", e);
      }

      console.log(
        "send-invite: content-type:",
        contentType,
        "bodyLength:",
        (rawText?.length ?? 0)
      );

      let raw: any = null;
      if (rawText && rawText.trim().length > 0) {
        if (contentType.includes("application/json")) {
          try {
            raw = JSON.parse(rawText);
          } catch (e) {
            console.error("send-invite: invalid JSON body", e);
          }
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          raw = Object.fromEntries(new URLSearchParams(rawText));
        } else {
          // Try JSON as a last resort
          try {
            raw = JSON.parse(rawText);
          } catch (_e) {
            raw = null;
          }
        }
      }

      if (!raw || typeof raw !== "object") {
        return new Response(
          JSON.stringify({
            error: "Invalid request body",
            detail: "Expected JSON or x-www-form-urlencoded payload",
            contentType,
            bodyLength: rawText?.length ?? 0,
          }),
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

    const base = appUrl ? String(appUrl).replace(/\/+$/, "") : "";
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

    // Verify email service configuration
    if (!RESEND_API_KEY) {
      console.warn("send-invite: RESEND_API_KEY is missing");
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
          detail: "Missing RESEND_API_KEY Supabase secret",
          action: "Add RESEND_API_KEY in Supabase Functions settings and verify your Resend domain",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(
      "send-invite: using FROM:",
      FROM,
      "usedDefault:",
      FROM_INFO.usedDefault ? `true (${FROM_INFO.reason})` : "false"
    );

    let sendResp: any;
    try {
      sendResp = await resend.emails.send({
        from: FROM,
        to: [email],
        subject: "You're invited to join",
        html,
      });
    } catch (e: any) {
      console.error("send-invite: exception while sending email", e);
      return new Response(
        JSON.stringify({
          error: "Email sending failed",
          provider_error: e?.message ?? String(e),
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (sendResp?.error) {
      console.error("send-invite: Resend send error", sendResp.error);
      
      let errorMessage = "Email sending failed";
      let userFriendlyMessage = sendResp.error?.message ?? String(sendResp.error);
      let setupInstructions = "";
      
      // Check for common Resend errors and provide helpful guidance
      const errorStr = String(sendResp.error?.message || sendResp.error).toLowerCase();
      
      if (errorStr.includes("can only send to your account")) {
        setupInstructions = "Resend is in testing mode. Go to https://resend.com/domains to verify your domain, or temporarily test with your account owner's email address.";
        userFriendlyMessage = "Email provider is in testing mode - domain verification required";
      } else if (errorStr.includes("domain") || errorStr.includes("unauthorized")) {
        setupInstructions = "Verify your domain at https://resend.com/domains and ensure RESEND_FROM uses a verified domain email.";
        userFriendlyMessage = "Email domain not verified";
      } else if (errorStr.includes("api key") || errorStr.includes("forbidden")) {
        setupInstructions = "Check your RESEND_API_KEY in Supabase secrets and ensure it's valid.";
        userFriendlyMessage = "Invalid email service API key";
      }
      
      return new Response(
        JSON.stringify({
          error: errorMessage,
          user_message: userFriendlyMessage,
          provider_error: sendResp.error?.message ?? String(sendResp.error),
          setup_instructions: setupInstructions,
          hint: "Check RESEND_FROM, verify domain in Resend, and ensure API key is valid",
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: sendResp?.data?.id ?? null }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-invite error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
