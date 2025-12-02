import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the authorization header to identify the requester
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify their identity
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the requesting user
    const { data: { user: requester }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requester) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { invitation_id } = await req.json();
    
    if (!invitation_id) {
      return new Response(
        JSON.stringify({ error: "Missing invitation_id parameter", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Delete invitation request: requester=${requester.id}, invitation=${invitation_id}`);

    // Check if requester is admin
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", requester.id)
      .single();

    // Get the invitation metadata
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitation_metadata")
      .select("*")
      .eq("id", invitation_id)
      .single();

    if (invitationError || !invitation) {
      console.error("Invitation not found:", invitationError);
      return new Response(
        JSON.stringify({ error: "Invitation not found", success: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check permission: must be super admin or company admin
    const isSuperAdmin = requesterProfile?.is_admin;
    
    let hasCompanyAccess = false;
    if (!isSuperAdmin) {
      const { data: companyAccess } = await supabaseAdmin
        .from("company_access")
        .select("role")
        .eq("user_id", requester.id)
        .eq("company_id", invitation.company_id)
        .single();
      
      hasCompanyAccess = companyAccess?.role === "admin";
    }

    if (!isSuperAdmin && !hasCompanyAccess) {
      return new Response(
        JSON.stringify({ error: "Permission denied: Admin access required", success: false }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation was already accepted
    if (invitation.is_accepted) {
      return new Response(
        JSON.stringify({ 
          error: "Cannot delete an accepted invitation. Use 'Delete User' instead.", 
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invitedEmail = invitation.invited_email;
    console.log(`Processing deletion for invitation to: ${invitedEmail}`);

    // Check if there's a user in auth.users with this email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    let userDeleted = false;
    let deletedUserId = null;

    if (!listError && authUsers) {
      const matchingUser = authUsers.users.find(
        u => u.email?.toLowerCase() === invitedEmail.toLowerCase()
      );

      if (matchingUser) {
        console.log(`Found user in auth.users: ${matchingUser.id}, confirmed: ${!!matchingUser.email_confirmed_at}`);
        
        // Only delete if the user hasn't confirmed their email (unconfirmed/pending user)
        if (!matchingUser.email_confirmed_at) {
          deletedUserId = matchingUser.id;

          // Clean up related records before deleting user
          // 1. Delete from company_access
          await supabaseAdmin
            .from("company_access")
            .delete()
            .eq("user_id", matchingUser.id);

          // 2. Delete from auth_codes
          await supabaseAdmin
            .from("auth_codes")
            .delete()
            .eq("user_id", matchingUser.id);

          // 3. Delete from profiles
          await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", matchingUser.id);

          // 4. Delete the user from auth.users
          const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(matchingUser.id);
          
          if (deleteAuthError) {
            console.error("Error deleting auth user:", deleteAuthError);
          } else {
            userDeleted = true;
            console.log(`Deleted unconfirmed user from auth.users: ${matchingUser.id}`);
          }
        } else {
          console.log(`User ${invitedEmail} has confirmed email, not deleting from auth.users`);
        }
      }
    }

    // Delete invitation resend logs first (foreign key)
    const { error: resendLogError } = await supabaseAdmin
      .from("invitation_resend_log")
      .delete()
      .eq("invitation_id", invitation_id);

    if (resendLogError) {
      console.error("Error deleting resend logs:", resendLogError);
    }

    // Delete the invitation metadata
    const { error: deleteInviteError } = await supabaseAdmin
      .from("invitation_metadata")
      .delete()
      .eq("id", invitation_id);

    if (deleteInviteError) {
      console.error("Error deleting invitation_metadata:", deleteInviteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete invitation", success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also clean up from the invitations table if exists
    await supabaseAdmin
      .from("invitations")
      .delete()
      .eq("email", invitedEmail)
      .eq("company_id", invitation.company_id);

    console.log(`Successfully deleted invitation for: ${invitedEmail}, user deleted: ${userDeleted}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: userDeleted 
          ? `Invitation and unconfirmed user account for ${invitedEmail} have been deleted`
          : `Invitation for ${invitedEmail} has been deleted`,
        email: invitedEmail,
        user_deleted: userDeleted,
        deleted_user_id: deletedUserId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
