import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== TEST CONNECTION FUNCTION CALLED ===");
  console.log(`Method: ${req.method}`);
  console.log(`Origin: ${req.headers.get("origin")}`);
  console.log(`Host: ${req.headers.get("host")}`);
  console.log(`URL: ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("CORS preflight request received");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response = {
      success: true,
      message: "Edge function is working!",
      timestamp: new Date().toISOString(),
      origin: req.headers.get("origin"),
      host: req.headers.get("host"),
      method: req.method,
      url: req.url,
      environment: {
        supabaseUrl: Deno.env.get("SUPABASE_URL") ? "SET" : "NOT SET",
        serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "SET" : "NOT SET"
      }
    };

    console.log("Test response:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error("Error in test-connection function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Test connection failed", 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        } 
      }
    );
  }
};

serve(handler);