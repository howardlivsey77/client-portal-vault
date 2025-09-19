
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

interface OTPVerificationProps {
  email: string;
  onSubmit: (otp: string) => Promise<void>;
  onCancel: () => void;
}

export const OTPVerification = ({ email, onSubmit, onCancel }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(otp);
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img src="/lovable-uploads/3fca6e51-90f5-44c9-ae11-38b6db5ee9a0.png" alt="Dootsons Logo" className="h-28 md:h-32" />
        </div>
        <CardDescription className="text-lg text-inherit font-semibold">
          Two-Factor Authentication
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-gray-500">
            Enter the 6-digit verification code sent to {email}
          </p>
          
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            disabled={loading || otp.length !== 6} 
            className="w-full text-gray-950 bg-amber-500 hover:bg-amber-400"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="w-full"
            disabled={loading}
          >
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
