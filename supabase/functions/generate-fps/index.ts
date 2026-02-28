/**
 * FPS Edge Function
 *
 * POST /generate-fps
 * Body: { companyId, taxYear, taxPeriod, finalSubmission?, schemeCeased?, dateSchemeCeased?, finalSubmissionForYear? }
 *
 * Returns: { xml, employeeCount, taxYear, taxPeriod, generatedAt }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadEmployerConfig } from './config.ts';
import { fetchPayrollResults, fetchEmployees, fetchPreviousPeriodResults } from './supabase-fetcher.ts';
import { buildFpsEmployees } from './fps-builder.ts';
import { generateFpsXml } from './fps-xml-generator.ts';
import { FpsInput } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth — caller must be authenticated and have payroll access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: FpsInput = await req.json();
    if (!body.companyId || !body.taxYear || !body.taxPeriod) {
      return new Response(JSON.stringify({ error: 'Missing required fields: companyId, taxYear, taxPeriod' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check payroll access using service role
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: hasAccess } = await serviceClient.rpc('user_has_payroll_access', {
      _user_id: user.id,
      _company_id: body.companyId,
    });

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions — payroll access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load employer config from env
    const config = loadEmployerConfig();

    // 1. Fetch payroll results for this period
    const payrollResults = await fetchPayrollResults(body.companyId, body.taxYear, body.taxPeriod);
    const employeeIds = payrollResults.map((r) => r.employee_id);

    // 2. Fetch employee records and previous period data in parallel
    const [employees, previousPeriodEmployeeIds] = await Promise.all([
      fetchEmployees(employeeIds),
      fetchPreviousPeriodResults(body.companyId, body.taxYear, body.taxPeriod, employeeIds),
    ]);

    // 3. Build FpsEmployee objects
    const fpsEmployees = buildFpsEmployees(payrollResults, employees, previousPeriodEmployeeIds, body.taxYear);

    if (fpsEmployees.length === 0) {
      return new Response(JSON.stringify({ error: 'No employees to include in FPS' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Generate XML with IRmark
    const xml = await generateFpsXml({
      config,
      employees: fpsEmployees,
      taxYear: body.taxYear,
      taxPeriod: body.taxPeriod,
      finalSubmission: body.finalSubmission,
      schemeCeased: body.schemeCeased,
      dateSchemeCeased: body.dateSchemeCeased,
      finalSubmissionForYear: body.finalSubmissionForYear,
    });

    const result = {
      xml,
      employeeCount: fpsEmployees.length,
      taxYear: body.taxYear,
      taxPeriod: body.taxPeriod,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('generate-fps error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
