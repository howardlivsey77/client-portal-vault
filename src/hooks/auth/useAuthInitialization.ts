import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAuthInitialization = (is2FAInProgress: boolean) => {
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    // Check if user is already logged in with enhanced error handling
    const checkSession = async () => {
      try {
        console.log("Auth page - Checking session...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth page - Error checking session:", error);
          if (mounted) setAuthInitialized(true);
          return;
        }
        
        console.log("Auth page - Session check result:", {
          hasSession: !!data.session,
          userEmail: data.session?.user?.email
        });
        
        if (data.session && mounted && !is2FAInProgress) {
          console.log("Auth page - User already logged in, redirecting to home");
          // Wait a moment to ensure providers are ready
          setTimeout(() => {
            navigate("/");
          }, 100);
        } else if (data.session && is2FAInProgress) {
          console.log("Auth page - User already logged in but 2FA in progress, NOT redirecting");
        }
      } catch (error) {
        console.error("Auth page - Exception checking session:", error);
      } finally {
        if (mounted) setAuthInitialized(true);
      }
    };
    
    checkSession();

    // Set up auth change listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth page - Auth state changed:", event, {
        hasSession: !!session,
        is2FAInProgress,
        mounted
      });
      
      if (session && mounted && !is2FAInProgress) {
        console.log("Auth page - User logged in, redirecting to home");
        // Small delay to ensure all providers are ready
        setTimeout(() => {
          navigate("/");
        }, 200);
      } else if (session && is2FAInProgress) {
        console.log("Auth page - User logged in but 2FA in progress, NOT redirecting");
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, is2FAInProgress]);

  return { authInitialized };
};
