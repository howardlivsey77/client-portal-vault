import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InvitationRequest {
  email: string;
  inviteCode: string;
  role: string;
  companyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Log request details for debugging
  const origin = req.headers.get("origin") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  console.log(`Request from origin: ${origin}, User-Agent: ${userAgent}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("CORS preflight request received");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log(`Invalid method: ${req.method}`);
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { email, inviteCode, role, companyId }: InvitationRequest = await req.json();

    if (!email || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Email and invite code are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("Sending invitation email to:", email);
    
    // Determine the correct base URL for redirect
    const requestOrigin = req.headers.get("origin");
    const baseUrl = requestOrigin || "https://0fda5de4-397f-460e-8be4-56e3718a981f.lovableproject.com";
    const redirectUrl = `${baseUrl}/accept-invitation?code=${inviteCode}`;
    
    console.log(`Using redirect URL: ${redirectUrl}`);

    // Use admin client to send invitation email
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.toLowerCase().trim(), {
      redirectTo: redirectUrl,
      data: {
        inviteCode: inviteCode,
        role: role,
        companyId: companyId
      }
    });

    if (error) {
      console.error("Error sending invitation email:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return new Response(
        JSON.stringify({ 
          error: "Failed to send invitation email", 
          details: error.message,
          user_message: "Failed to send invitation email. Please check your SMTP configuration in Supabase.",
          setup_instructions: "Configure SMTP settings in Supabase Dashboard: Authentication > Settings > SMTP Settings",
          debug_info: {
            origin: requestOrigin,
            redirectUrl: redirectUrl
          }
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Invitation email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
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