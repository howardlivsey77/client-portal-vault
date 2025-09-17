import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  inviteCode: string;
  role: string;
  companyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    // Use admin client to send invitation email
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.toLowerCase().trim(), {
      redirectTo: `${req.headers.get("origin") || "http://localhost:5173"}/accept-invitation?code=${inviteCode}`,
      data: {
        inviteCode: inviteCode,
        role: role,
        companyId: companyId
      }
    });

    if (error) {
      console.error("Error sending invitation email:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send invitation email", 
          details: error.message,
          user_message: "Failed to send invitation email. Please check your SMTP configuration in Supabase.",
          setup_instructions: "Configure SMTP settings in Supabase Dashboard: Authentication > Settings > SMTP Settings"
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
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        user_message: "Failed to send invitation email due to server error."
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);