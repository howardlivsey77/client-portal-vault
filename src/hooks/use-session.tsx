
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export const useSession = (onAuthenticated?: () => void) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session && onAuthenticated) {
        onAuthenticated();
      }
      
      setLoading(false);
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session && onAuthenticated) {
          onAuthenticated();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onAuthenticated]);

  return { session, loading };
};
