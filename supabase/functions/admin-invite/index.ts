import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InviteRequest {
  email: string;
  company_id: string;
  role: string;
  redirect_to?: string;
  origin?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const reqId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Get the user's JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's token for auth validation
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin permissions
    const { data: hasAccess, error: accessError } = await supabaseUser
      .rpc('user_has_company_access', { 
        _user_id: user.id, 
        _company_id: null, 
        _required_role: 'admin' 
      });

    if (accessError) {
      console.error('Error checking access:', accessError);
      throw new Error('Access check failed');
    }

    const { data: isAdmin, error: adminError } = await supabaseUser
      .rpc('is_admin', { user_id: user.id });

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      throw new Error('Admin check failed');
    }

    if (!isAdmin && !hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const { email, company_id, role, redirect_to, origin }: InviteRequest = await req.json();

    console.log(JSON.stringify({ 
      evt: "invite.start", 
      reqId, 
      email: email?.toLowerCase()?.trim(), 
      role, 
      company_id,
      timestamp: new Date().toISOString()
    }));

    if (!email || !company_id || !role) {
      throw new Error('Missing required fields: email, company_id, role');
    }

    // Check if user already exists in auth.users
    console.log(JSON.stringify({
      evt: "invite.check_existing_user",
      reqId,
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString()
    }));

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (existingUser) {
      console.log(JSON.stringify({
        evt: "invite.existing_user_found",
        reqId,
        email: email.toLowerCase().trim(),
        user_id: existingUser.id,
        timestamp: new Date().toISOString()
      }));

      // Check if they already have company_access
      const { data: existingAccess, error: accessCheckError } = await supabaseAdmin
        .from('company_access')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('company_id', company_id)
        .single();

      if (existingAccess) {
        throw new Error('User already has access to this company');
      }

      // Add company_access directly for existing user
      const { error: accessError } = await supabaseAdmin
        .from('company_access')
        .insert({
          user_id: existingUser.id,
          company_id: company_id,
          role: role
        });

      if (accessError) {
        console.error(JSON.stringify({
          evt: "invite.existing_user_access_error",
          reqId,
          email: email.toLowerCase().trim(),
          error: accessError,
          timestamp: new Date().toISOString()
        }));
        throw new Error(`Failed to add existing user to company: ${accessError.message}`);
      }

      const duration = Date.now() - startTime;

      console.log(JSON.stringify({
        evt: "invite.existing_user_added",
        reqId,
        email: email.toLowerCase().trim(),
        company_id,
        role,
        user_id: existingUser.id,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }));

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Existing user added to company',
          user_id: existingUser.id,
          existing_user: true,
          duration_ms: duration
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // User doesn't exist - proceed with standard invitation flow
    // Store invitation metadata first
    console.log(JSON.stringify({
      evt: "invite.metadata_insert_attempt",
      reqId,
      email: email.toLowerCase().trim(),
      company_id,
      role,
      timestamp: new Date().toISOString()
    }));

    const { data: metadataResult, error: metadataError } = await supabaseAdmin
      .from('invitation_metadata')
      .insert({
        invited_email: email.toLowerCase().trim(),
        invited_by: user.id,
        company_id: company_id,
        role: role
      })
      .select()
      .single();

    if (metadataError) {
      console.error(JSON.stringify({
        evt: "invite.metadata_error",
        reqId,
        email: email.toLowerCase().trim(),
        error: metadataError,
        errorCode: metadataError.code,
        errorMessage: metadataError.message,
        errorDetails: metadataError.details,
        errorHint: metadataError.hint,
        timestamp: new Date().toISOString()
      }));
      if (metadataError.code === '23505') {
        throw new Error('User already has an active invitation for this company');
      }
      throw new Error(`Failed to create invitation metadata: ${metadataError.message} (Code: ${metadataError.code})`);
    }

    console.log(JSON.stringify({
      evt: "invite.metadata_created",
      reqId,
      email: email.toLowerCase().trim(),
      invitation_id: metadataResult.id,
      timestamp: new Date().toISOString()
    }));

    // Send Supabase native invitation
    const redirectUrl = redirect_to || `${origin || 'https://payroll.dootsons.com'}/auth`;
    
    console.log(JSON.stringify({
      evt: "invite.auth_call_start",
      reqId,
      email: email.toLowerCase().trim(),
      redirectUrl,
      timestamp: new Date().toISOString()
    }));
    
    const { data: inviteResult, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: redirectUrl,
        data: {
          company_id: company_id,
          role: role,
          invited_by: user.id,
          must_set_password: true
        }
      }
    );

    if (inviteError) {
      console.error(JSON.stringify({
        evt: "invite.auth_error",
        reqId,
        email: email.toLowerCase().trim(),
        error: inviteError,
        errorMessage: inviteError.message,
        errorCode: inviteError.code,
        timestamp: new Date().toISOString()
      }));
      
      // Clean up metadata if invite failed
      await supabaseAdmin
        .from('invitation_metadata')
        .delete()
        .eq('id', metadataResult.id);
        
      throw new Error(`Failed to send invitation: ${inviteError.message}`);
    }

    const duration = Date.now() - startTime;
    
    console.log(JSON.stringify({
      evt: "invite.success",
      reqId,
      email: email.toLowerCase().trim(),
      company_id,
      role,
      invitation_id: metadataResult.id,
      user_id: inviteResult.user?.id,
      duration_ms: duration,
      providerResult: {
        user_exists: !!inviteResult.user?.email_confirmed_at,
        user_id: inviteResult.user?.id,
        user_created_at: inviteResult.user?.created_at
      },
      timestamp: new Date().toISOString()
    }));

    // Generate invite URL for copy/paste backup using token
    const inviteUrl = `${redirectUrl}?token=${metadataResult.token}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invitation_id: metadataResult.id,
        user_id: inviteResult.user?.id,
        invite_url: inviteUrl,
        duration_ms: duration
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(JSON.stringify({
      evt: "invite.error",
      reqId,
      message: error?.message || "Unknown error",
      code: error?.code,
      detail: error?.response?.data ?? error?.stack,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }));
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        request_id: reqId
      }),
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);