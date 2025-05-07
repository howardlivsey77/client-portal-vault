
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use a Supabase function to check if user is admin first
      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_user_admin', { user_id: (await supabase.auth.getUser()).data.user?.id });
        
      if (adminCheckError || !isAdmin) {
        throw new Error("Permission denied: You don't have access to view users.");
      }

      // If we reach here, user is admin, proceed to fetch profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      
      // Handle permission errors gracefully
      if (error.message && error.message.includes("permission denied")) {
        setError("Permission denied: You don't have access to view users.");
        toast({
          title: "Error fetching users",
          description: "Permission denied: You don't have access to view users.",
          variant: "destructive"
        });
      } else {
        setError(error.message || "An error occurred while fetching users.");
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive"
        });
      }
      
      // Set empty users array in case of error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserRole = async (userId: string, isAdmin: boolean) => {
    setLoading(true);
    try {
      setError(null);
      const { error } = await supabase
        .from("profiles")
        .update({
          is_admin: isAdmin
        })
        .eq("id", userId);
      
      if (error) throw error;
      
      toast({
        title: "Role updated",
        description: `User's role has been updated to ${isAdmin ? 'administrator' : 'regular user'}.`,
      });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error("Error updating role:", error);
      
      // Handle permission errors
      if (error.message && error.message.includes("permission denied")) {
        setError("Permission denied: You don't have access to update user roles.");
        toast({
          title: "Error updating role",
          description: "Permission denied: You don't have access to update user roles.",
          variant: "destructive"
        });
      } else {
        setError(error.message || "An error occurred while updating user role.");
        toast({
          title: "Error updating role",
          description: error.message,
          variant: "destructive"
        });
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserRole
  };
};
