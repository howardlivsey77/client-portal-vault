import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  company_id: string;
  role: string;
  redirect_to?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { email, company_id, role, redirect_to }: InviteRequest = await req.json();

    if (!email || !company_id || !role) {
      throw new Error('Missing required fields: email, company_id, role');
    }

    // Store invitation metadata first
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
      console.error('Metadata error:', metadataError);
      if (metadataError.code === '23505') {
        throw new Error('User already has an active invitation for this company');
      }
      throw new Error(`Failed to create invitation metadata: ${metadataError.message}`);
    }

    // Send Supabase native invitation
    const redirectUrl = redirect_to || `${new URL(req.url).origin}/auth`;
    
    const { data: inviteResult, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: redirectUrl,
        data: {
          company_id: company_id,
          role: role,
          invited_by: user.id
        }
      }
    );

    if (inviteError) {
      console.error('Supabase invite error:', inviteError);
      
      // Clean up metadata if invite failed
      await supabaseAdmin
        .from('invitation_metadata')
        .delete()
        .eq('id', metadataResult.id);
        
      throw new Error(`Failed to send invitation: ${inviteError.message}`);
    }

    console.log('Invitation sent successfully:', {
      email: email,
      company_id: company_id,
      role: role,
      user_id: inviteResult.user?.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invitation_id: metadataResult.id,
        user_id: inviteResult.user?.id
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
    console.error('Error in admin-invite function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
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