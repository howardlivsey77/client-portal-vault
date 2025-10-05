
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
  
  const handleOtpRequired = (factorId: string, email: string) => {
    setFactorId(factorId);
    setVerificationEmail(email);
    setShowOtpVerification(true);
  };

  const cancelOtpVerification = () => {
    setShowOtpVerification(false);
    setFactorId(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
      {showOtpVerification ? (
        <OTPVerification 
          email={verificationEmail} 
          onSubmit={async (otp) => {
            if (!factorId) return;
            try {
              // Verify the email 2FA code via edge function
              const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
                body: { code: otp, userId: factorId } // factorId now stores userId
              });

              if (error || !data?.success) {
                throw new Error(error?.message || data?.error || "Failed to verify code");
              }

              // Sign the user in again after successful 2FA
              // We need to complete the authentication flow
              setShowOtpVerification(false);
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
