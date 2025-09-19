
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onSuccess?: (userId: string) => Promise<void>;
  onOtpRequired: (factorId: string, email: string) => void;
}

export const LoginForm = ({ onSuccess, onOtpRequired }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
          onOtpRequired(totpFactor.id, email);
          setLoading(false);
          return;
        }
      }

      // If we get here, 2FA is not required or not set up
      if (data.user && onSuccess) {
        await onSuccess(data.user.id);
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

  return (
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
  );
};
