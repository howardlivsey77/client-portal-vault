import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { AuthContainer, PasswordSetupForm } from "@/components/auth";

interface InvitationDetails {
  email: string;
  role: string;
  company_id: string;
  company_name?: string;
  invited_by_name?: string;
}

type Status = 'loading' | 'needs_auth' | 'needs_password' | 'processing' | 'success' | 'error';

export default function AcceptInviteToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<Status>('loading');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const token = searchParams.get('token');

  // Check auth state and load invitation details
  useEffect(() => {
    const checkAuthAndLoadInvitation = async () => {
      try {
        // Check current auth state
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (!token) {
          setError('Invalid invitation link - missing token');
          setStatus('error');
          return;
        }

        // Load invitation details
        const { data: invitationData, error: inviteError } = await supabase
          .from('invitation_metadata')
          .select(`
            *,
            companies (name)
          `)
          .eq('token', token)
          .eq('is_accepted', false)
          .maybeSingle();

        if (inviteError) {
          console.error('Error loading invitation:', inviteError);
          setError('Failed to load invitation details');
          setStatus('error');
          return;
        }

        if (!invitationData) {
          setError('Invalid or expired invitation link');
          setStatus('error');
          return;
        }

        setInvitation({
          email: invitationData.invited_email,
          role: invitationData.role,
          company_id: invitationData.company_id,
          company_name: invitationData.companies?.name
        });

        // Check if user is authenticated
        if (!session?.user) {
          setStatus('needs_auth');
          return;
        }

        // Check if email matches
        if (session.user.email !== invitationData.invited_email) {
          setError(`This invitation was sent to ${invitationData.invited_email}. Please sign in with the correct email address.`);
          setStatus('error');
          return;
        }

        // Check if user needs to set password (invited users)
        const needsPassword = await checkIfPasswordSetupNeeded(session.user);
        if (needsPassword) {
          setStatus('needs_password');
          return;
        }

        // Auto-accept if authenticated with correct email and password is set
        await acceptInvitation(session.user.id, token);

      } catch (error: any) {
        console.error('Error in checkAuthAndLoadInvitation:', error);
        setError(error.message || 'Failed to process invitation');
        setStatus('error');
      }
    };

    checkAuthAndLoadInvitation();
  }, [token]);

  const acceptInvitation = async (userId: string, inviteToken: string) => {
    try {
      setStatus('processing');
      
      console.log(`🎫 [INVITE] Accepting invitation with token: ${inviteToken}`);

      // Create company access record
      const { error: accessError } = await supabase
        .from('company_access')
        .insert({
          user_id: userId,
          company_id: invitation!.company_id,
          role: invitation!.role
        });

      if (accessError && accessError.code !== '23505') { // Ignore duplicate key errors
        throw accessError;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitation_metadata')
        .update({
          is_accepted: true,
          accepted_at: new Date().toISOString()
        })
        .eq('token', inviteToken);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ [INVITE] Successfully accepted invitation for ${invitation!.company_name}`);
      
      setStatus('success');
      
      toast({
        title: "Invitation accepted!",
        description: `You now have ${invitation!.role} access to ${invitation!.company_name}`,
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation');
      setStatus('error');
    }
  };

  // Check if user needs to set up password (for invited users)
  const checkIfPasswordSetupNeeded = async (user: any) => {
    try {
      // Check if user was created via invitation and hasn't set password yet
      // Users created via invitation won't have password_set_via_invitation flag
      const hasPasswordFlag = user.user_metadata?.password_set_via_invitation;
      
      // If they don't have the flag, they likely need to set up password
      return !hasPasswordFlag;
    } catch (error) {
      console.error('Error checking password setup status:', error);
      return false; // Default to not requiring password setup if check fails
    }
  };

  const handleAuthSuccess = async () => {
    // Re-check everything after successful auth
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && invitation) {
      if (session.user.email === invitation.email) {
        // Check if password setup is needed
        const needsPassword = await checkIfPasswordSetupNeeded(session.user);
        if (needsPassword) {
          setStatus('needs_password');
        } else {
          await acceptInvitation(session.user.id, token!);
        }
      } else {
        setError(`This invitation was sent to ${invitation.email}. Please sign in with the correct email address.`);
        setStatus('error');
      }
    }
  };

  const handlePasswordSetupComplete = async () => {
    // After password is set, proceed with invitation acceptance
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && token) {
      await acceptInvitation(session.user.id, token);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </div>
        );

      case 'needs_auth':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Join {invitation?.company_name}</h2>
              <p className="text-muted-foreground mb-4">
                You've been invited to join as a <span className="font-medium">{invitation?.role}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please sign in with <strong>{invitation?.email}</strong> to accept this invitation
              </p>
            </div>
            <AuthContainer onSuccess={handleAuthSuccess} />
          </div>
        );

      case 'needs_password':
        return (
          <PasswordSetupForm 
            onSuccess={handlePasswordSetupComplete} 
            userEmail={invitation?.email || ''} 
          />
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Accepting invitation...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome to {invitation?.company_name}!</h2>
            <p className="text-muted-foreground mb-4">
              You now have {invitation?.role} access to the company.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Accept Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Dashboard
              </Button>
              <div>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="ghost" 
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Team Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}