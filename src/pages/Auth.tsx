import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const {
          data,
          error
        } = await supabase.auth.getSession();
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
      data: {
        subscription
      }
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
      const {
        error
      } = await supabase.auth.signInWithPassword({
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
        return;
      }
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
    } finally {
      setLoading(false);
    }
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
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <img src="/lovable-uploads/3e0f0f1b-006e-4094-a7af-1a0b28bab13c.png" alt="Ramsay Brown Logo" className="h-16" />
            </div>
            <CardDescription className="font-normal text-slate-950 text-lg">Payroll Management Portal </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-orange-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full text-gray-950 bg-amber-500 hover:bg-amber-400">
                {loading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </> : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PageContainer>;
};
export default Auth;