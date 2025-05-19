
import { useState } from "react";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { OTPVerification } from "./OTPVerification";
import { supabase } from "@/integrations/supabase/client";

interface AuthContainerProps {
  onSuccess: (userId: string) => Promise<void>;
}

export const AuthContainer = ({ onSuccess }: AuthContainerProps) => {
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  const handleOtpRequired = (factorId: string, email: string) => {
    setFactorId(factorId);
    setVerificationEmail(email);
    setShowOtpVerification(true);
  };

  const cancelOtpVerification = () => {
    setShowOtpVerification(false);
    setFactorId(null);
  };
  
  const resetForm = () => {
    // Reset form state when changing tabs
    setActiveTab(activeTab === "login" ? "signup" : "login");
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "signup");
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
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png" 
                alt="Dootsons Logo" 
                className="h-28 md:h-32" 
              />
            </div>
            <CardDescription className="text-lg text-inherit font-semibold">
              Payroll Management Portal 
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm 
                onSuccess={onSuccess}
                onOtpRequired={handleOtpRequired}
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignupForm 
                onSuccess={onSuccess}
                onComplete={() => setActiveTab("login")}
              />
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
};
