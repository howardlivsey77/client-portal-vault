
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
              // First create a challenge
              const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId
              });
              if (challengeError) throw challengeError;

              // Then verify with the challenge ID
              const { data, error } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code: otp
              });
              if (error) throw error;

              // The response has changed - check if we have a valid response with the session
              if (data && data.user) {
                // Assign user to default company if needed
                await onSuccess(data.user.id);
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
            <div className="space-y-2">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Payroll Management Portal
              </CardDescription>
            </div>
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
