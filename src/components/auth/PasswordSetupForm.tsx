import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    if (strength < 2) return "bg-red-500";
    if (strength < 3) return "bg-orange-500";
    if (strength < 4) return "bg-yellow-500";
    return "bg-green-500";
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
        description: "Your account is now secure. Welcome to the team!",
      });
      
      onSuccess();
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
                <span className={`font-medium ${
                  passwordStrength < 2 ? 'text-red-500' :
                  passwordStrength < 3 ? 'text-orange-500' :
                  passwordStrength < 4 ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {getStrengthText(passwordStrength)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
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
            <li className={password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
            <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>One uppercase letter</li>
            <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>One lowercase letter</li>
            <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>One number</li>
            <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>One special character</li>
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