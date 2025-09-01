import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { AuthContainer } from "@/components/auth/AuthContainer";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [status, setStatus] = useState<'checking' | 'auth_needed' | 'processing' | 'success' | 'error'>('checking');
  const [error, setError] = useState<string>("");
  
  const inviteCode = searchParams.get('code');

  useEffect(() => {
    if (!inviteCode) {
      setStatus('error');
      setError('No invitation code provided');
      return;
    }

    if (isLoading) return;

    if (!user) {
      setStatus('auth_needed');
      return;
    }

    acceptInvitation();
  }, [inviteCode, user, isLoading]);

  const acceptInvitation = async () => {
    if (!inviteCode || !user) return;
    
    setStatus('processing');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        _invite_code: inviteCode,
        _user_id: user.id
      });

      if (error) throw error;

      const result = data as any;
      
      if (result?.success) {
        setInvitation(result.invitation);
        setStatus('success');
        toast({
          title: "Welcome!",
          description: `You have successfully joined as ${result.invitation.role}`
        });
        
        // Redirect to main app after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setStatus('error');
        setError(result?.error || 'Failed to accept invitation');
        toast({
          title: "Error",
          description: result?.error || 'Failed to accept invitation',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setError(error.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    // After successful auth, the useEffect will trigger acceptInvitation
    setStatus('checking');
  };

  if (status === 'checking' || isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Checking invitation...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (status === 'auth_needed') {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Accept Invitation</CardTitle>
              <CardDescription>
                Please sign in or create an account to accept this invitation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthContainer onSuccess={handleAuthSuccess} />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (status === 'processing') {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Processing invitation...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (status === 'success') {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>
                You have successfully accepted the invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {invitation && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{invitation.role}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Redirecting you to the application in a few seconds...
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Continue to App
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Error state
  return (
    <PageContainer>
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>
              There was a problem with your invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AcceptInvite;