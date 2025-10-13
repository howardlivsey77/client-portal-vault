import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteEmployeeRequest {
  employeeId: string
  email: string
  companyId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { employeeId, email, companyId }: InviteEmployeeRequest = await req.json()

    // Verify the user has admin access to this company
    const { data: access, error: accessError } = await supabaseClient
      .from('company_access')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single()

    if (accessError || access?.role !== 'admin') {
      // Check if super admin
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        throw new Error('Insufficient permissions')
      }
    }

    // Verify employee exists and belongs to this company
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('id, first_name, last_name, email')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .single()

    if (employeeError || !employee) {
      throw new Error('Employee not found')
    }

    // Check if user already exists with this email
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(u => u.email === email)

    if (userExists) {
      throw new Error('A user account already exists with this email address')
    }

    // Check for existing invitation
    const { data: existingInvite } = await supabaseClient
      .from('invitation_metadata')
      .select('id, is_accepted')
      .eq('invited_email', email)
      .eq('company_id', companyId)
      .single()

    if (existingInvite && !existingInvite.is_accepted) {
      throw new Error('An invitation has already been sent to this email')
    }

    // Create invitation metadata
    const { error: inviteError } = await supabaseClient
      .from('invitation_metadata')
      .insert({
        invited_email: email,
        invited_by: user.id,
        company_id: companyId,
        role: 'employee',
      })

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      throw new Error('Failed to create invitation')
    }

    // Update employee record
    const { error: updateError } = await supabaseClient
      .from('employees')
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq('id', employeeId)

    if (updateError) {
      console.error('Error updating employee:', updateError)
    }

    // Send invitation email via Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://your-app.lovable.app'

    const { error: emailError } = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM') || 'onboarding@resend.dev',
      to: [email],
      subject: 'You\'ve been invited to access your Employee Portal',
      html: `
        <h1>Welcome to the Employee Portal!</h1>
        <p>Hi ${employee.first_name} ${employee.last_name},</p>
        <p>You've been invited to access your employee portal where you can:</p>
        <ul>
          <li>View and update your personal information</li>
          <li>Access your payslips and tax documents</li>
          <li>View your timesheet records</li>
          <li>Manage your contact details</li>
        </ul>
        <p>
          <a href="${appUrl}/auth?email=${encodeURIComponent(email)}" 
             style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Create Your Account
          </a>
        </p>
        <p>This invitation will expire in 7 days.</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      `,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      throw new Error('Failed to send invitation email')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in invite-employee function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
