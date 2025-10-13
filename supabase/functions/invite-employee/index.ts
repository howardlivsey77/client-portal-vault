import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteEmployeeRequest {
  employeeId: string;
  companyId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { employeeId, companyId }: InviteEmployeeRequest = await req.json();

    // Verify user is admin of this company
    const { data: access, error: accessError } = await supabaseClient
      .from('company_access')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (accessError || access?.role !== 'admin') {
      throw new Error('Insufficient permissions - must be company admin');
    }

    // Get employee details
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('id, first_name, last_name, email, company_id, portal_access_enabled, invitation_sent_at')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .single();

    if (employeeError || !employee) {
      throw new Error('Employee not found');
    }

    if (!employee.email) {
      throw new Error('Employee must have an email address to receive invitation');
    }

    if (employee.portal_access_enabled) {
      throw new Error('Employee already has portal access');
    }

    // Check if user already exists with this email
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', employee.email)
      .single();

    if (existingProfile) {
      throw new Error('A user account already exists with this email address');
    }

    // Create invitation metadata
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitation_metadata')
      .insert({
        invited_email: employee.email,
        invited_by: user.id,
        company_id: companyId,
        role: 'employee',
      })
      .select()
      .single();

    if (inviteError) {
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }

    // Update employee record with invitation timestamp
    const { error: updateError } = await supabaseClient
      .from('employees')
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Failed to update employee invitation timestamp:', updateError);
    }

    // Get company name for email
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const companyName = company?.name || 'Your Company';

    // Send invitation email using Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 
                    'https://your-app.lovable.app';
    
    const invitationLink = `${baseUrl}/auth?token=${invitation.token}`;

    const { error: emailError } = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM') || 'onboarding@resend.dev',
      to: [employee.email],
      subject: `Access Your Employee Portal - ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to ${companyName} Employee Portal</h1>
          <p>Hi ${employee.first_name} ${employee.last_name},</p>
          <p>You've been invited to access the employee portal where you can:</p>
          <ul>
            <li>View and update your personal information</li>
            <li>View your payslips and timesheets</li>
            <li>Manage your employee records</li>
          </ul>
          <p>Click the button below to create your account and get started:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Create Your Account
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This invitation link will expire in 7 days.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't expect this invitation, please contact your HR department.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Failed to send email:', emailError);
      throw new Error('Failed to send invitation email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invitationId: invitation.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in invite-employee:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while sending the invitation',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
