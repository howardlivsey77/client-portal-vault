
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

      console.log("Fetching user profiles...");
      
      // Wait a moment to ensure auth and database are ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to fetch profiles with enhanced error handling
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Profiles fetch error:", error);
        
        // Check for specific error types
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          setError("User profiles are not available. Please contact your administrator.");
          toast({
            title: "Database Setup Required",
            description: "User profiles table needs to be configured. Please contact support.",
            variant: "destructive"
          });
        } else if (error.message.includes("permission denied") || error.code === "42501") {
          setError("Permission denied: You don't have access to view user profiles.");
          toast({
            title: "Access Restricted",
            description: "You don't have permission to view user profiles.",
            variant: "destructive"
          });
        } else if (error.message.includes("JWT")) {
          setError("Authentication issue. Please try logging out and back in.");
          toast({
            title: "Authentication Error",
            description: "Please try logging out and back in.",
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
        
        setUsers([]);
        return;
      }
      
      console.log("Profiles data retrieved:", data?.length || 0, "records");
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
      
      // Wait to ensure auth is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { error } = await supabase
        .from("profiles")
        .update({
          is_admin: isAdmin
        })
        .eq("id", userId);
      
      if (error) {
        console.error("Error updating role:", error);
        
        if (error.message && error.message.includes("permission denied")) {
          setError("Permission denied: You don't have access to update user roles.");
          toast({
            title: "Permission Denied",
            description: "You don't have access to update user roles.",
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
      }
      
      toast({
        title: "Role updated",
        description: `User's role has been updated to ${isAdmin ? 'administrator' : 'regular user'}.`,
      });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error("Exception updating role:", error);
      setError(error.message || "An error occurred while updating user role.");
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setLoading(true);
    try {
      setError(null);
      
      console.log("Deleting user:", userId);
      
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId }
      });
      
      if (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error deleting user",
          description: error.message || "Failed to delete user",
          variant: "destructive"
        });
        return false;
      }
      
      if (data?.error) {
        console.error("Delete user error:", data.error);
        toast({
          title: "Error deleting user",
          description: data.error,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "User deleted",
        description: data?.message || "User has been successfully deleted.",
      });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error("Exception deleting user:", error);
      toast({
        title: "Error deleting user",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Delay initial fetch to ensure auth is ready
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);
  
  return {
    users,
    loading,
    error,
    fetchUsers,
    updateUserRole,
    deleteUser
  };
};
