
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAuthInitialization = () => {
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();

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

  return { authInitialized };
};
