
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SignupFormProps {
  onSuccess?: (userId: string) => Promise<void>;
  onComplete: () => void;
}

export const SignupForm = ({ onSuccess, onComplete }: SignupFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
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
        onComplete();
        setLoading(false);
        return;
      }
      
      // If we have a user and onSuccess handler
      if (data.user && onSuccess) {
        await onSuccess(data.user.id);
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
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
};
