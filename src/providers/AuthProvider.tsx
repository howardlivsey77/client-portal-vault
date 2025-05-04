
import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
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

  // Modified function to check if user is admin without triggering RLS issues
  const checkUserAdmin = async (userId: string) => {
    try {
      console.log("Checking admin status for user ID:", userId);
      
      // Using a service role function to bypass RLS
      const { data, error } = await supabase
        .rpc('is_user_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        return;
      }
      
      console.log("Admin status check result:", data);
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Exception checking admin status:", error);
      setIsAdmin(false);
    }
  };
  
  // Temporary direct access to set admin status until we can fix the RLS issue
  const checkAdminWithoutRLS = async (userId: string) => {
    try {
      // Hard-code the admin check for known admin users as a temporary fix
      if (userId === "94f95aea-cbc9-4e87-b870-8da7d8e24814" || 
          user?.email === "howard.livsey@ingenisoft.co.uk") {
        console.log("Setting admin status to true for known admin user");
        setIsAdmin(true);
        return;
      }
      
      // Fallback to regular check
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error in direct admin check:", error);
        return;
      }
      
      console.log("Direct admin check result:", data);
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error("Exception in direct admin check:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // When auth changes, check if user is admin
        if (session?.user) {
          // Use our temporary fix instead
          await checkAdminWithoutRLS(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );
    
    // Then check for existing session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use our temporary fix instead
          await checkAdminWithoutRLS(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    session,
    user,
    isAdmin,
    isLoading,
    signOut,
  };

  console.log("Auth context updated - User:", user?.email, "Admin:", isAdmin);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
