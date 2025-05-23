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

      console.log("Fetching profiles...");
      
      // Try to fetch profiles with better error handling
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Profiles fetch error:", error);
        
        // Check if it's a permission error or table doesn't exist
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          setError("Profiles table not found. Please contact your administrator.");
        } else if (error.message.includes("permission denied")) {
          setError("Permission denied: You don't have access to view users.");
        } else {
          setError(error.message || "An error occurred while fetching users.");
        }
        
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive"
        });
        
        setUsers([]);
        return;
      }
      
      console.log("Profiles data:", data);
      setUsers(data || []);
    } catch (error: any) {
      console.error("Exception fetching users:", error);
      setError(error.message || "An unexpected error occurred.");
      setUsers([]);
      
      toast({
        title: "Error fetching users",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
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
