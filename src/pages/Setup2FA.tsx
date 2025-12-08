import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Setup2FA = () => {
  const [enabling, setEnabling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already has 2FA enabled, if so redirect to home
    const check2FAStatus = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_2fa_enabled')
        .eq('id', user.id)
        .single();
      
      if (profile?.is_2fa_enabled) {
        navigate('/');
      }
    };
    
    check2FAStatus();
  }, [user, navigate]);

  const handleSendCode = async () => {
    if (!user?.email) return;
    
    try {
      setEnabling(true);
      
      const { error: sendError } = await supabase.functions.invoke('send-2fa-code', {
        body: { email: user.email, userId: user.id }
      });

      if (sendError) throw sendError;

      setShowVerification(true);
      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit code"
      });
    } catch (error: any) {
      console.error("Error sending code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive"
      });
    } finally {
      setEnabling(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!user) return;
    
    try {
      setVerifying(true);
      
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: { code, userId: user.id }
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "Invalid verification code");
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_2fa_enabled: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled"
      });
      
      navigate('/');
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <PageContainer title="Two-Factor Authentication Required">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary" />
              Secure Your Account
            </CardTitle>
            <CardDescription>
              Two-factor authentication is required for all users. This adds an extra layer of security to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showVerification ? (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertTitle>Email Verification Required</AlertTitle>
                  <AlertDescription>
                    Click the button below to receive a 6-digit verification code at <strong>{user?.email}</strong>. 
                    You'll need to enter this code each time you sign in.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={handleSendCode}
                    disabled={enabling}
                    size="lg"
                  >
                    {enabling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : "Send Verification Code"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertTitle>Check your email</AlertTitle>
                  <AlertDescription>
                    We've sent a 6-digit verification code to <strong>{user?.email}</strong>. Enter it below to complete setup.
                  </AlertDescription>
                </Alert>
                
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Enter the verification code:
                  </p>
                  
                  <div className="flex justify-center mb-4">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowVerification(false);
                        setCode("");
                      }}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleVerifyAndEnable}
                      disabled={verifying || code.length !== 6}
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : "Verify & Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Setup2FA;
