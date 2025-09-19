import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  console.log('=== SEND-INVITE PROXY START ===');
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Read the request body
    const body = await req.text();
    console.log('Request body:', body);

    // Build target URL for the invite function
    const url = new URL(req.url);
    const targetUrl = `${url.protocol}//${url.host}/invite`;
    
    console.log('Forwarding to:', targetUrl);

    // Forward the request to the invite function
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    console.log('Upstream response status:', response.status);
    
    const responseText = await response.text();
    console.log('Upstream response:', responseText);

    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Proxy failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});