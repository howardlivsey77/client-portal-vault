import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { AuthContainer } from "@/components/auth/AuthContainer";

interface InvitationDetails {
  email: string;
  role: string;
  company_id: string;
}

interface AcceptInvitationResponse {
  success: boolean;
  error?: string;
  invitation?: InvitationDetails;
}

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [status, setStatus] = useState<'checking' | 'pending_auth' | 'processing' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMessage('No invitation code provided');
      return;
    }
    setInviteCode(code);
  }, [searchParams]);

  useEffect(() => {
    if (inviteCode && user) {
      handleAcceptInvitation();
    } else if (inviteCode && !user) {
      setStatus('pending_auth');
    }
  }, [inviteCode, user]);

  const handleAcceptInvitation = async () => {
    if (!inviteCode || !user) return;

    setLoading(true);
    setStatus('processing');

    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        _invite_code: inviteCode,
        _user_id: user.id
      });

      if (error) {
        throw error;
      }

      const result = data as unknown as AcceptInvitationResponse;
      
      if (!result.success) {
        setStatus('error');
        setErrorMessage(result.error || 'Unknown error occurred');
        toast({
          title: "Invitation Error",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
        return;
      }

      if (result.invitation) {
        setInvitationDetails(result.invitation);
      }
      setStatus('success');
      
      toast({
        title: "Welcome!",
        description: `You've successfully joined as ${result.invitation?.role || 'team member'}`,
      });

      // Redirect to main app after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setErrorMessage('Failed to accept invitation. Please try again.');
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (userId: string) => {
    // Auth success will trigger useEffect to process invitation
  };

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking invitation...</p>
          </div>
        );

      case 'pending_auth':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Mail className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-semibold">You've been invited!</h2>
              <p className="text-muted-foreground">
                Please sign in or create an account to accept this invitation.
              </p>
            </div>
            <AuthContainer onSuccess={handleAuthSuccess} />
          </div>
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing invitation...</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-2xl font-semibold text-green-700">Welcome!</h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                You've successfully accepted the invitation.
              </p>
              {invitationDetails && (
                <p className="text-sm text-muted-foreground">
                  Role: <span className="font-medium">{invitationDetails.role}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Redirecting you to the application...
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4 text-center">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-2xl font-semibold text-red-700">Invitation Error</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Home
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
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
};

export default AcceptInvite;