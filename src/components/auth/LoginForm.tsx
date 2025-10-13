
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/providers/AuthProvider";

interface LoginFormProps {
  onSuccess?: (userId: string) => Promise<void>;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const { setIs2FAInProgress, signOut } = useAuth();

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

      if (!data.user) {
        toast({
          title: "Login failed",
          description: "Unable to authenticate user",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Check if email-based 2FA is enabled for the user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_2fa_enabled')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      if (profile?.is_2fa_enabled) {
        console.log("Email 2FA required for user");
        
        // Send verification code via edge function
        const { error: sendError } = await supabase.functions.invoke('send-2fa-code', {
          body: { email: data.user.email, userId: data.user.id }
        });

        if (sendError) {
          console.error("Error sending 2FA code:", sendError);
          toast({
            title: "Error",
            description: "Failed to send verification code",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Show OTP verification UI inline and prevent redirect
        setUserId(data.user.id);
        setShow2FA(true);
        setIs2FAInProgress(true);
        setLoading(false);
        return;
      }

      // If we get here, 2FA is not enabled
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

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || otp.length !== 6) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: { userId, code: otp }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "Failed to verify code");
      }

      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in."
      });

      // Clear 2FA in progress flag to allow redirect
      setIs2FAInProgress(false);

      if (onSuccess) {
        await onSuccess(userId);
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    setShow2FA(false);
    setUserId(null);
    setOtp("");
    setPassword("");
    setIs2FAInProgress(false);
    // Sign out to clear the session
    await signOut();
  };

  const handleResendCode = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-2fa-code', {
        body: { email, userId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <form onSubmit={handleOtpVerification}>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground">
              A 6-digit code has been sent to {email}
            </p>
          </div>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
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
          <div className="flex justify-center">
            <Button
              type="button"
              variant="link"
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm"
            >
              Resend Code
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            type="submit" 
            disabled={loading || otp.length !== 6} 
            className="w-full text-gray-950 bg-teal-500 hover:bg-teal-400"
          >
            {loading ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </> : "Verify"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackToLogin}
            disabled={loading}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardFooter>
      </form>
    );
  }

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
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Button
              type="button"
              variant="link"
              className="px-0 text-sm h-auto"
              onClick={async () => {
                if (!email) {
                  toast({
                    title: "Email required",
                    description: "Please enter your email address first",
                    variant: "destructive"
                  });
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/create-password`
                });
                if (error) {
                  toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                  });
                } else {
                  toast({
                    title: "Check your email",
                    description: "We've sent you a password reset link"
                  });
                }
              }}
            >
              Forgot password?
            </Button>
          </div>
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
