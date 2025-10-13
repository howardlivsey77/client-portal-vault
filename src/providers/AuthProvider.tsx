
import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  requires2FASetup: boolean;
  is2FAInProgress: boolean;
  setIs2FAInProgress: (inProgress: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
  requires2FASetup: false,
  is2FAInProgress: false,
  setIs2FAInProgress: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [requires2FASetup, setRequires2FASetup] = useState<boolean>(false);
  const [is2FAInProgress, setIs2FAInProgress] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check admin status and 2FA status using the security definer function
  const checkAdminStatus = async (userId: string) => {
    try {
      // Check via secure RPC; no direct table fallbacks to avoid RLS bypass
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking admin status with RPC:", error);
        return false;
      }
      
      console.log("Admin check result:", data);
      return !!data; // Convert to boolean
    } catch (error) {
      console.error("Exception in admin check:", error);
      return false;
    }
  };

  // Check if user needs to set up 2FA
  const check2FAStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_2fa_enabled')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error checking 2FA status:", error);
        return false;
      }
      
      return profile?.is_2fa_enabled || false;
    } catch (error) {
      console.error("Exception in 2FA check:", error);
      return false;
    }
  };

  // Handle auth state changes
  const handleAuthChange = async (_event: string, newSession: Session | null) => {
    console.log("Auth state changed:", _event, "Session:", newSession?.user?.email);
    
    setSession(newSession);
    setUser(newSession?.user ?? null);
    
    // If session becomes null, reset admin status and 2FA requirement
    if (!newSession) {
      setIsAdmin(false);
      setRequires2FASetup(false);
      return;
    }
    
    // Use setTimeout to prevent potential deadlocks with Supabase
    setTimeout(async () => {
      if (newSession?.user) {
        const adminStatus = await checkAdminStatus(newSession.user.id);
        setIsAdmin(adminStatus);
        
        const has2FA = await check2FAStatus(newSession.user.id);
        setRequires2FASetup(!has2FA);
      }
    }, 0);
  };

  useEffect(() => {
    // Set up a timeout to prevent infinite loading states
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Auth loading timeout reached, forcing loading state to complete");
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout as a safety mechanism
    
    setLoadingTimeout(timeout);
    
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    console.log("Auth provider initializing...");
    
    // Set up auth state listener first before getting the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    
    // Then check for existing session
    const initializeAuth = async () => {
      try {
        console.log("Getting initial session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          setAuthInitialized(true);
          return;
        }

        console.log("Initial session retrieved:", data.session?.user?.email);
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Check admin status and 2FA status separately to avoid nesting Supabase calls
          const adminStatus = await checkAdminStatus(data.session.user.id);
          setIsAdmin(adminStatus);
          
          const has2FA = await check2FAStatus(data.session.user.id);
          setRequires2FASetup(!has2FA);
        }
      } catch (error) {
        console.error("Exception initializing auth:", error);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
    
    return () => {
      console.log("Auth provider cleaning up...");
      subscription.unsubscribe();
    };
  }, []);
  
  const signOut = async () => {
    try {
      console.log("Signing out...");
      setIsLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    isAdmin,
    isLoading,
    requires2FASetup,
    is2FAInProgress,
    setIs2FAInProgress,
    signOut,
  };

  console.log("Auth context value:", {
    userEmail: user?.email,
    isAdmin,
    isLoading,
    authInitialized
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
