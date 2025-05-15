
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { OTPVerification } from "@/components/auth/OTPVerification";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth page - Error checking session:", error);
          setAuthInitialized(true);
          return;
        }
        console.log("Auth page - Session check:", data.session?.user?.email);
        if (data.session) {
          console.log("Auth page - User already logged in, redirecting to home");
          navigate("/");
        }
      } catch (error) {
        console.error("Auth page - Exception checking session:", error);
      } finally {
        setAuthInitialized(true);
      }
    };
    checkSession();

    // Set up auth change listener
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth page - Auth state changed:", event);
      if (session) {
        console.log("Auth page - User logged in, redirecting to home");
        navigate("/");
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Attempting sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Check if 2FA is enabled for the user
      if (data?.session === null && data?.user !== null) {
        // This means 2FA is required
        console.log("2FA required for user");
        
        // Get the TOTP factor
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totpFactor = factorsData.all.find(factor => factor.factor_type === 'totp');
        
        if (totpFactor) {
          setFactorId(totpFactor.id);
          setShowOtpVerification(true);
          setLoading(false);
          return;
        }
      }

      // If we get here, 2FA is not required or not set up
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in."
      });

      // Navigation will happen via the auth state change listener
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    if (!factorId) {
      toast({
        title: "Error",
        description: "No authentication factor found",
        variant: "destructive"
      });
      return;
    }

    try {
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) throw challengeError;
      
      // Then verify with the challenge ID
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: otp,
      });

      if (error) {
        throw error;
      }

      // The response has changed - check if we have a valid response with the session
      if (data) {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in."
        });
        // Navigation will happen via the auth state change listener
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  const cancelOtpVerification = () => {
    setShowOtpVerification(false);
    setFactorId(null);
    setPassword(""); // Clear password for security
  };

  // Show loading indicator until we've checked the session
  if (!authInitialized) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
        {showOtpVerification ? (
          <OTPVerification 
            email={email}
            onSubmit={handleVerifyOTP}
            onCancel={cancelOtpVerification}
          />
        ) : (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png" alt="Dootsons Logo" className="h-28 md:h-32" />
              </div>
              <CardDescription className="text-lg text-inherit font-semibold">
                Payroll Management Portal 
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="bg-orange-100" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="bg-orange-100" 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full text-gray-950 bg-amber-500 hover:bg-amber-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : "Login"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default Auth;
