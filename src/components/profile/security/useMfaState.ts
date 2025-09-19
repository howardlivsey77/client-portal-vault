
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export const useMfaState = () => {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [has2fa, setHas2fa] = useState(false);
  const [existingFactorId, setExistingFactorId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const checkMfaStatus = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.mfa.listFactors();
        
        if (error) throw error;
        
        const totpFactor = data.all.find(factor => factor.factor_type === 'totp');
        
        // If a factor exists, store its ID for future operations
        if (totpFactor) {
          setExistingFactorId(totpFactor.id);
        }
        
        setHas2fa(totpFactor?.status === 'verified');
      } catch (error: any) {
        console.error("Error checking MFA status:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load security settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkMfaStatus();
  }, [user, toast]);

  // Helper function to unenroll an existing factor
  const handleUnenrollExistingFactor = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorId,
      });
      
      if (error) throw error;
      
      setExistingFactorId(null);
    } catch (error: any) {
      console.error("Error unenrolling existing MFA:", error);
      throw error; // Propagate the error to the caller
    }
  };

  const handleEnrollMfa = async () => {
    try {
      // If there's an unverified factor, we need to unenroll it first
      if (existingFactorId && !has2fa) {
        await handleUnenrollExistingFactor(existingFactorId);
      }
      
      setEnrolling(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        // Use a short app name and include only email (not full user ID)
        issuer: 'App',
        friendlyName: user?.email?.split('@')[0] || 'user',
      });
      
      if (error) throw error;
      
      setExistingFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (error: any) {
      console.error("Error enrolling MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up 2FA",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!existingFactorId) {
      toast({
        title: "Error",
        description: "No 2FA factor found to verify",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setVerifying(true);
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: existingFactorId,
      });
      
      if (challengeError) throw challengeError;
      
      // Then verify with the challenge ID
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: existingFactorId,
        challengeId: challengeData.id,
        code: otp,
      });
      
      if (verifyError) throw verifyError;
      
      setQrCode(null);
      setSecret(null);
      setOtp("");
      setHas2fa(true);
      
      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled",
      });
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify 2FA code",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenrollMfa = async () => {
    if (!existingFactorId) {
      toast({
        title: "Error",
        description: "No 2FA factor found to disable",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUnenrolling(true);
      
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: existingFactorId,
      });
      
      if (error) throw error;
      
      setHas2fa(false);
      setExistingFactorId(null);
      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled",
      });
    } catch (error: any) {
      console.error("Error unenrolling MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive"
      });
    } finally {
      setUnenrolling(false);
    }
  };

  return {
    loading,
    enrolling,
    verifying,
    unenrolling,
    qrCode,
    secret,
    otp,
    setOtp,
    has2fa,
    existingFactorId,
    handleEnrollMfa,
    handleVerifyMfa,
    handleUnenrollMfa
  };
};
