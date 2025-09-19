import { ClerkProvider, useUser, useAuth as useClerkAuth, useSession } from '@clerk/clerk-react';
import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { createClerkSupabaseClient, supabaseClient } from '@/integrations/supabase/clerk-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Clerk publishable key (hardcoded since env variables are not supported)
const CLERK_PUBLISHABLE_KEY = 'pk_test_Y29tcGV0ZW50LXNhaWxmaXNoLTI4LmNsZXJrLmFjY291bnRzLmRldiQ';

interface AuthContextType {
  user: any;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  supabase: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
  supabase: supabaseClient,
});

export function useAuth() {
  return useContext(AuthContext);
}

const AuthProviderInner = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useClerkAuth();
  const { session } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [supabase, setSupabase] = useState(supabaseClient);

  // Create Supabase client with Clerk session token
  useEffect(() => {
    if (session && getToken) {
      const clerkSupabase = createClerkSupabaseClient(async () => {
        try {
          return await getToken({ template: 'supabase' });
        } catch (error) {
          console.error('Error getting Clerk token:', error);
          return null;
        }
      });
      setSupabase(clerkSupabase);
    } else {
      setSupabase(supabaseClient);
    }
  }, [session, getToken]);

  // Check admin status using the existing security definer function
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking admin status with RPC:", error);
        return false;
      }
      
      console.log("Admin check result:", data);
      return !!data;
    } catch (error) {
      console.error("Exception in admin check:", error);
      return false;
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkAdminStatus(user.id).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user?.id]);

  const signOut = async () => {
    try {
      await clerkSignOut();
      setIsAdmin(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    isAdmin,
    isLoading: !isLoaded,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

interface ClerkAuthProviderProps {
  children: ReactNode;
}

export const ClerkAuthProvider = ({ children }: ClerkAuthProviderProps) => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </ClerkProvider>
  );
};