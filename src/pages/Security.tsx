import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks";
import { Loader2, ShieldCheck, ShieldX, Mail } from "lucide-react";
import { useAuth } from "@/providers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Security = () => {
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [verifyingTest, setVerifyingTest] = useState(false);
  const [testCode, setTestCode] = useState("");
  const [showTestVerification, setShowTestVerification] = useState(false);
  const [has2fa, setHas2fa] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const check2FAStatus = async () => {
      try {
        setLoading(true);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_2fa_enabled')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setHas2fa(profile?.is_2fa_enabled || false);
      } catch (error: any) {
        console.error("Error checking 2FA status:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load security settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    check2FAStatus();
  }, [user, toast]);

  const handleEnable2FA = async () => {
    if (!user?.email) return;
    
    try {
      setEnabling(true);
      
      // Send test verification code
      const { error: sendError } = await supabase.functions.invoke('send-2fa-code', {
        body: { email: user.email, userId: user.id }
      });

      if (sendError) throw sendError;

      setShowTestVerification(true);
      toast({
        title: "Verification code sent",
        description: "Check your email for the verification code"
      });
    } catch (error: any) {
      console.error("Error enabling 2FA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive"
      });
    } finally {
      setEnabling(false);
    }
  };

  const handleVerifyTest = async () => {
    if (!user) return;
    
    try {
      setVerifyingTest(true);
      
      // Verify the test code
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: { code: testCode, userId: user.id }
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "Invalid verification code");
      }

      // Enable 2FA in profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_2fa_enabled: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setHas2fa(true);
      setShowTestVerification(false);
      setTestCode("");
      
      toast({
        title: "Success",
        description: "Email 2FA has been enabled for your account"
      });
    } catch (error: any) {
      console.error("Error verifying test code:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive"
      });
    } finally {
      setVerifyingTest(false);
    }
  };


  if (loading) {
    return (
      <PageContainer title="Security Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Security Settings">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className={has2fa ? "text-primary" : "text-amber-500"} />
              Email Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security by requiring a verification code sent to your email when signing in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {has2fa ? (
              <Alert className="bg-primary/10 border-primary/20">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertTitle>Protected</AlertTitle>
                <AlertDescription>
                  Your account is protected with email-based two-factor authentication. You'll receive a code at <strong>{user?.email}</strong> each time you sign in.
                </AlertDescription>
              </Alert>
            ) : showTestVerification ? (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertTitle>Verify your email</AlertTitle>
                  <AlertDescription>
                    We've sent a 6-digit verification code to <strong>{user?.email}</strong>. Enter it below to enable 2FA.
                  </AlertDescription>
                </Alert>
                
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Enter the verification code:
                  </p>
                  
                  <div className="flex justify-center mb-4">
                    <InputOTP maxLength={6} value={testCode} onChange={setTestCode}>
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
                        setShowTestVerification(false);
                        setTestCode("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleVerifyTest}
                      disabled={verifyingTest || testCode.length !== 6}
                    >
                      {verifyingTest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : "Verify & Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Alert className="bg-amber-50 border-amber-200">
                <ShieldX className="h-4 w-4 text-amber-500" />
                <AlertTitle>Two-Factor Authentication Required</AlertTitle>
                <AlertDescription>
                  Two-factor authentication is mandatory for all users. You'll be prompted to enable it before accessing the application.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Security;
