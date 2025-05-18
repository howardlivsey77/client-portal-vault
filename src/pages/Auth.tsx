
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

      // Assign user to default company if they don't have any company access yet
      if (data.user) {
        await ensureCompanyAccess(data.user.id);
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || ''
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast({
          title: "Sign up successful",
          description: "Please check your email to confirm your account.",
        });
        setActiveTab("login");
        setLoading(false);
        return;
      }
      
      // Assign user to default company if they don't have any company access yet
      if (data.user) {
        await ensureCompanyAccess(data.user.id);
      }
      
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
      
      // Navigation will happen via the auth state change listener
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Function to make sure user has access to at least one company
  const ensureCompanyAccess = async (userId: string) => {
    try {
      // Check if the user already has company access
      const { data: accessData } = await supabase
        .from('company_access')
        .select('company_id')
        .eq('user_id', userId);

      // If user doesn't have any company access, assign to default company
      if (!accessData || accessData.length === 0) {
        // Get the default company (first one created)
        const { data: defaultCompany } = await supabase
          .from('companies')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (defaultCompany) {
          // Assign user to default company with 'user' role
          await supabase
            .from('company_access')
            .insert({
              user_id: userId,
              company_id: defaultCompany.id,
              role: 'user'
            });

          console.log("User assigned to default company");
        }
      }
    } catch (error) {
      console.error("Error ensuring company access:", error);
      // We don't stop the authentication flow if this fails
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
        factorId
      });
      if (challengeError) throw challengeError;

      // Then verify with the challenge ID
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: otp
      });
      if (error) {
        throw error;
      }

      // The response has changed - check if we have a valid response with the session
      if (data) {
        // Assign user to default company if needed
        if (data.user) {
          await ensureCompanyAccess(data.user.id);
        }

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

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
  };

  // Show loading indicator until we've checked the session
  if (!authInitialized) {
    return <PageContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>;
  }

  return <PageContainer>
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
        {showOtpVerification ? <OTPVerification email={email} onSubmit={handleVerifyOTP} onCancel={cancelOtpVerification} /> : 
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png" alt="Dootsons Logo" className="h-28 md:h-32" />
              </div>
              <CardDescription className="text-lg text-inherit font-semibold">
                Payroll Management Portal 
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => {
              setActiveTab(value as "login" | "signup");
              resetForm();
            }}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input 
                        id="login-email" 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="bg-teal-100" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input 
                        id="login-password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="bg-teal-100" 
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full text-gray-950 bg-teal-500 hover:bg-teal-400"
                    >
                      {loading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </> : "Login"}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="bg-teal-100" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name (Optional)</Label>
                      <Input 
                        id="full-name" 
                        type="text" 
                        placeholder="John Doe" 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)}
                        className="bg-teal-100" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input 
                        id="signup-password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="bg-teal-100" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        required 
                        className="bg-teal-100" 
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full text-gray-950 bg-teal-500 hover:bg-teal-400"
                    >
                      {loading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </> : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        }
      </div>
    </PageContainer>;
};

export default Auth;
