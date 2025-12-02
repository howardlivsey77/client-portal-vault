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
        JSON.stringify({ error: "Missing authorization header" }),
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
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { userId: targetUserId } = await req.json();
    
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Delete user request: requester=${requester.id}, target=${targetUserId}`);

    // Check if requester is admin
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", requester.id)
      .single();

    if (profileError || !requesterProfile?.is_admin) {
      console.error("Permission check failed:", profileError);
      return new Response(
        JSON.stringify({ error: "Only administrators can delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-deletion
    if (requester.id === targetUserId) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target user exists and get their info
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, is_admin")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetProfile) {
      console.error("Target user not found:", targetError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deleting the last admin
    if (targetProfile.is_admin) {
      const { count, error: countError } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_admin", true);

      if (countError) {
        console.error("Error counting admins:", countError);
        return new Response(
          JSON.stringify({ error: "Failed to verify admin count" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (count && count <= 1) {
        return new Response(
          JSON.stringify({ error: "Cannot delete the last administrator" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Deleting user: ${targetProfile.email}`);

    // Start cleanup process - SET NULL for foreign key references first
    // 1. Update employees to remove user_id reference
    await supabaseAdmin
      .from("employees")
      .update({ user_id: requester.id }) // Transfer to requester or could set to a system user
      .eq("user_id", targetUserId);

    // 2. Update invitations issued_by
    await supabaseAdmin
      .from("invitations")
      .update({ issued_by: requester.id })
      .eq("issued_by", targetUserId);

    // 3. Update invitation_metadata invited_by
    await supabaseAdmin
      .from("invitation_metadata")
      .update({ invited_by: requester.id })
      .eq("invited_by", targetUserId);

    // 4. Update documents uploaded_by
    await supabaseAdmin
      .from("documents")
      .update({ uploaded_by: requester.id })
      .eq("uploaded_by", targetUserId);

    // 5. Update document_folders created_by
    await supabaseAdmin
      .from("document_folders")
      .update({ created_by: requester.id })
      .eq("created_by", targetUserId);

    // 6. Update tasks created_by and assigned_to
    await supabaseAdmin
      .from("tasks")
      .update({ created_by: requester.id })
      .eq("created_by", targetUserId);

    await supabaseAdmin
      .from("tasks")
      .update({ assigned_to: null })
      .eq("assigned_to", targetUserId);

    // 7. Update payroll_periods user_id
    await supabaseAdmin
      .from("payroll_periods")
      .update({ user_id: requester.id })
      .eq("user_id", targetUserId);

    // 8. Update departments created_by
    await supabaseAdmin
      .from("departments")
      .update({ created_by: requester.id })
      .eq("created_by", targetUserId);

    // 9. Update legal_holds created_by
    await supabaseAdmin
      .from("legal_holds")
      .update({ created_by: requester.id })
      .eq("created_by", targetUserId);

    // 10. Update erasure_requests requester_id
    await supabaseAdmin
      .from("erasure_requests")
      .update({ requester_id: requester.id })
      .eq("requester_id", targetUserId);

    // 11. Update data_export_requests requester_id
    await supabaseAdmin
      .from("data_export_requests")
      .update({ requester_id: requester.id })
      .eq("requester_id", targetUserId);

    // Now delete from tables that reference user_id directly
    // Delete from company_access
    const { error: companyAccessError } = await supabaseAdmin
      .from("company_access")
      .delete()
      .eq("user_id", targetUserId);

    if (companyAccessError) {
      console.error("Error deleting company_access:", companyAccessError);
    }

    // Delete from auth_codes
    const { error: authCodesError } = await supabaseAdmin
      .from("auth_codes")
      .delete()
      .eq("user_id", targetUserId);

    if (authCodesError) {
      console.error("Error deleting auth_codes:", authCodesError);
    }

    // Log the deletion to admin_audit_log before deleting profile
    const { error: auditError } = await supabaseAdmin
      .from("admin_audit_log")
      .insert({
        target_user_id: targetUserId,
        changed_by: requester.id,
        old_admin_status: targetProfile.is_admin,
        new_admin_status: false,
        change_reason: `User account deleted by administrator`
      });

    if (auditError) {
      console.error("Error creating audit log:", auditError);
    }

    // Delete from profiles
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Finally, delete from auth.users using admin API
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user from authentication system" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted user: ${targetProfile.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${targetProfile.email} has been deleted`,
        deletedUser: {
          email: targetProfile.email,
          fullName: targetProfile.full_name
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
