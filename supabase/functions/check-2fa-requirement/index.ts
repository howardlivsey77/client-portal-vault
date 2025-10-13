import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log('check-2fa-requirement called with email:', email);

    if (!email) {
      console.log('No email provided in request');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has 2FA enabled
    console.log('Querying profiles table for email:', email.toLowerCase().trim());
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_2fa_enabled')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      console.error('Error checking 2FA status:', error);
      console.log('Profile not found or error occurred - defaulting to 2FA not required');
      // If profile doesn't exist, 2FA is not required
      return new Response(
        JSON.stringify({ requires2FA: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile found:', profile);
    const requires2FA = profile?.is_2fa_enabled || false;
    console.log('Returning requires2FA:', requires2FA);

    return new Response(
      JSON.stringify({ requires2FA }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-2fa-requirement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
