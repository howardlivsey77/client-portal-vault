
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

export const ProfileSecurityTab = () => {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [has2fa, setHas2fa] = useState(false);
  const [existingFactorId, setExistingFactorId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const checkMfaStatus = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.mfa.listFactors();
        
        if (error) throw error;
        
        const totpFactor = data.all.find(factor => factor.factor_type === 'totp');
        
        // If a factor exists, store its ID for future operations
        if (totpFactor) {
          setExistingFactorId(totpFactor.id);
        }
        
        setHas2fa(totpFactor?.status === 'verified');
      } catch (error: any) {
        console.error("Error checking MFA status:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load security settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkMfaStatus();
  }, [user, toast]);

  const handleEnrollMfa = async () => {
    try {
      // If there's an unverified factor, we need to unenroll it first
      if (existingFactorId && !has2fa) {
        await handleUnenrollExistingFactor(existingFactorId);
      }
      
      setEnrolling(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        // Use a short app name and include only email (not full user ID)
        issuer: 'App',
        friendlyName: user?.email?.split('@')[0] || 'user',
      });
      
      if (error) throw error;
      
      setExistingFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (error: any) {
      console.error("Error enrolling MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up 2FA",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Helper function to unenroll an existing factor
  const handleUnenrollExistingFactor = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorId,
      });
      
      if (error) throw error;
      
      setExistingFactorId(null);
    } catch (error: any) {
      console.error("Error unenrolling existing MFA:", error);
      throw error; // Propagate the error to the caller
    }
  };

  const handleVerifyMfa = async () => {
    if (!existingFactorId) {
      toast({
        title: "Error",
        description: "No 2FA factor found to verify",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setVerifying(true);
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: existingFactorId,
      });
      
      if (challengeError) throw challengeError;
      
      // Then verify with the challenge ID
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: existingFactorId,
        challengeId: challengeData.id,
        code: otp,
      });
      
      if (verifyError) throw verifyError;
      
      setQrCode(null);
      setSecret(null);
      setOtp("");
      setHas2fa(true);
      
      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled",
      });
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify 2FA code",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenrollMfa = async () => {
    if (!existingFactorId) {
      toast({
        title: "Error",
        description: "No 2FA factor found to disable",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUnenrolling(true);
      
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: existingFactorId,
      });
      
      if (error) throw error;
      
      setHas2fa(false);
      setExistingFactorId(null);
      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled",
      });
    } catch (error: any) {
      console.error("Error unenrolling MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive"
      });
    } finally {
      setUnenrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {has2fa ? (
              <>
                <ShieldCheck className="text-green-500" />
                Two-Factor Authentication (Enabled)
              </>
            ) : (
              <>
                <ShieldX className="text-amber-500" />
                Two-Factor Authentication (Disabled)
              </>
            )}
          </CardTitle>
          <CardDescription>
            Enhance your account security by enabling two-factor authentication (2FA).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {has2fa ? (
            <Alert className="bg-green-50 border-green-200">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <AlertTitle>Protected</AlertTitle>
              <AlertDescription>
                Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app each time you sign in.
              </AlertDescription>
            </Alert>
          ) : qrCode ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-medium mb-2">Scan this QR code</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to scan this QR code.
                </p>
                <div className="flex justify-center mb-4">
                  {/* Use errorCorrection="H" to increase QR code error tolerance */}
                  <QRCodeSVG 
                    value={qrCode} 
                    size={200} 
                    level="H" /* Higher error correction */
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Or enter this code manually</h3>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded select-all">
                  {secret}
                </p>
              </div>

              <div className="pt-4">
                <h3 className="font-medium mb-2">Verify Setup</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Enter the 6-digit code from your authenticator app to verify setup
                </p>
                
                <div className="flex justify-center mb-4">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              Two-factor authentication adds an extra layer of security to your account. When enabled, 
              you'll need to provide both your password and a code from your authenticator app when signing in.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          {has2fa ? (
            <Button 
              variant="destructive" 
              onClick={handleUnenrollMfa} 
              disabled={unenrolling}
            >
              {unenrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : "Disable 2FA"}
            </Button>
          ) : qrCode ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setQrCode(null);
                  setSecret(null);
                  setOtp("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyMfa} 
                disabled={verifying || otp.length !== 6}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : "Verify & Enable"}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleEnrollMfa} 
              disabled={enrolling}
            >
              {enrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : "Enable 2FA"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Update your password to maintain account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            For security reasons, you'll need to use the password reset feature to change your password.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Reset Password</Button>
        </CardFooter>
      </Card>
    </div>
  );
};
