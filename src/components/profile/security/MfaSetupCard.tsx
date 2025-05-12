
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMfaState } from "./useMfaState";

export const MfaSetupCard = () => {
  const { 
    loading, 
    has2fa, 
    qrCode, 
    secret, 
    otp, setOtp, 
    existingFactorId,
    enrolling, unenrolling, verifying,
    handleEnrollMfa, 
    handleVerifyMfa, 
    handleUnenrollMfa 
  } = useMfaState();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
          <MfaQrSetup qrCode={qrCode} secret={secret} otp={otp} setOtp={setOtp} />
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
                setOtp("");
                window.location.reload();  // Refresh to reset the state
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
  );
};

interface MfaQrSetupProps {
  qrCode: string;
  secret: string | null;
  otp: string;
  setOtp: (otp: string) => void;
}

export const MfaQrSetup = ({ qrCode, secret, otp, setOtp }: MfaQrSetupProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-medium mb-2">Scan this QR code</h3>
        <p className="text-sm text-gray-500 mb-4">
          Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to scan this QR code.
        </p>
        <div className="flex justify-center mb-4">
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
  );
};
