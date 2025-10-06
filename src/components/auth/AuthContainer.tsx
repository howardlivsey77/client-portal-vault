
import { useState } from "react";
import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";
import { OTPVerification } from "./OTPVerification";
import { supabase } from "@/integrations/supabase/client";

interface AuthContainerProps {
  onSuccess: (userId: string) => Promise<void>;
}

export const AuthContainer = ({ onSuccess }: AuthContainerProps) => {
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  
  const handleOtpRequired = (factorId: string, email: string, password: string) => {
    setFactorId(factorId);
    setVerificationEmail(email);
    setStoredPassword(password);
    setShowOtpVerification(true);
  };

  const cancelOtpVerification = () => {
    setShowOtpVerification(false);
    setFactorId(null);
    setStoredPassword(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
      {showOtpVerification ? (
        <OTPVerification 
          email={verificationEmail} 
          onSubmit={async (otp) => {
            if (!factorId || !storedPassword) return;
            try {
              // Verify the email 2FA code via edge function
              const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
                body: { code: otp, userId: factorId } // factorId now stores userId
              });

              if (error || !data?.success) {
                throw new Error(error?.message || data?.error || "Failed to verify code");
              }

              // Re-authenticate user with stored credentials after successful 2FA
              const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: verificationEmail,
                password: storedPassword
              });

              if (authError || !authData.user) {
                throw new Error(authError?.message || "Failed to sign in after 2FA verification");
              }

              // Clear stored credentials
              setStoredPassword(null);
              setShowOtpVerification(false);

              // Complete authentication flow
              if (onSuccess) {
                await onSuccess(authData.user.id);
              }
            } catch (error) {
              throw error;
            }
          }}
          onCancel={cancelOtpVerification}
        />
      ) : (
        <Card className="w-full">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png" 
                alt="Dootsons Logo" 
                className="h-28 md:h-32" 
              />
            </div>
            <CardTitle className="text-2xl">Payroll Management Portal</CardTitle>
          </CardHeader>
          
          <LoginForm 
            onSuccess={onSuccess}
            onOtpRequired={handleOtpRequired}
          />
        </Card>
      )}
    </div>
  );
};
