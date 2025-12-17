import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useBrandColors } from "@/brand";

interface PasswordSetupFormProps {
  onSuccess: () => void;
  userEmail: string;
}

export const PasswordSetupForm = ({ onSuccess, userEmail }: PasswordSetupFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const brandColors = useBrandColors();

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return "bg-destructive";
    if (strength < 3) return "bg-orange-500";
    if (strength < 4) return "bg-yellow-500";
    return `bg-primary`;
  };

  const getStrengthTextStyle = (strength: number) => {
    if (strength < 2) return { color: 'hsl(var(--destructive))' };
    if (strength < 3) return { color: '#f97316' }; // orange-500
    if (strength < 4) return { color: '#eab308' }; // yellow-500
    return { color: `hsl(${brandColors.success})` };
  };

  const getStrengthText = (strength: number) => {
    if (strength < 2) return "Weak";
    if (strength < 3) return "Fair";
    if (strength < 4) return "Good";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    const strength = getPasswordStrength(password);
    if (strength < 3) {
      toast({
        title: "Password too weak",
        description: "Please choose a stronger password with a mix of uppercase, lowercase, numbers, and symbols.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }

      // Mark password as set in user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          password_set_via_invitation: true
        }
      });

      if (metadataError) {
        console.warn("Failed to update user metadata:", metadataError);
      }
      
      toast({
        title: "Password set successfully!",
        description: "Please sign in with your new password to complete the setup.",
      });
      
      // Sign out the user to force re-authentication with new password
      await supabase.auth.signOut();
      
      // Redirect to auth page for re-login
      navigate("/auth");
    } catch (error: any) {
      console.error("Password setup error:", error);
      toast({
        title: "Failed to set password",
        description: error.message || "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const checkMet = (condition: boolean) => condition ? { color: `hsl(${brandColors.success})` } : undefined;

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Set Your Password</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete your account setup by creating a secure password for {userEmail}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter a secure password"
              required 
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Password strength:</span>
                <span className="font-medium" style={getStrengthTextStyle(passwordStrength)}>
                  {getStrengthText(passwordStrength)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength)}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input 
              id="confirm-password" 
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="Confirm your password"
              required 
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Your password should contain:</p>
          <ul className="list-disc list-inside space-y-1">
            <li style={checkMet(password.length >= 8)}>At least 8 characters</li>
            <li style={checkMet(/[A-Z]/.test(password))}>One uppercase letter</li>
            <li style={checkMet(/[a-z]/.test(password))}>One lowercase letter</li>
            <li style={checkMet(/[0-9]/.test(password))}>One number</li>
            <li style={checkMet(/[^A-Za-z0-9]/.test(password))}>One special character</li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          type="submit" 
          disabled={loading || passwordStrength < 3}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting password...
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};
