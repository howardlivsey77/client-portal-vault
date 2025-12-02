import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { invokeFunction } from "@/supabase-invoke-guard";

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: 'pending' | 'active';
  date: string;
  // For pending invitations
  invitationId?: string;
  token?: string;
  companyId?: string;
  // For active users
  userId?: string;
  isAdmin?: boolean;
}

export const useTeamMembers = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      // Fetch both invitations and users in parallel
      const [invitationsResult, usersResult] = await Promise.all([
        supabase.rpc('get_invitation_metadata', { _user_id: userId, _company_id: null }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false })
      ]);

      const invitations = invitationsResult.data || [];
      const users = usersResult.data || [];

      // Convert invitations to TeamMember format (only pending ones)
      const pendingMembers: TeamMember[] = invitations
        .filter((inv: any) => !inv.is_accepted)
        .map((inv: any) => ({
          id: `inv-${inv.id}`,
          email: inv.invited_email,
          name: null,
          role: inv.role,
          status: 'pending' as const,
          date: inv.created_at,
          invitationId: inv.id,
          token: inv.token,
          companyId: inv.company_id,
        }));

      // Convert users to TeamMember format
      const activeMembers: TeamMember[] = users.map((user: any) => ({
        id: `user-${user.id}`,
        email: user.email,
        name: user.full_name,
        role: user.is_admin ? 'admin' : 'user',
        status: 'active' as const,
        date: user.created_at,
        userId: user.id,
        isAdmin: user.is_admin,
      }));

      // Combine and sort by date (most recent first)
      const allMembers = [...pendingMembers, ...activeMembers].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMembers(allMembers);
    } catch (err: any) {
      console.error("Error fetching team members:", err);
      setError(err.message || "Failed to fetch team members");
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteInvitation = async (invitationId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await invokeFunction('delete-invitation', {
        body: { invitation_id: invitationId }
      });

      if (error) {
        let errorMessage = 'Failed to delete invitation';
        const jsonMatch = error.message?.match(/\{.*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            errorMessage = parsed.error || errorMessage;
          } catch {
            errorMessage = error.message || errorMessage;
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to delete invitation');
      }

      toast({
        title: "Invitation deleted",
        description: data.user_deleted
          ? "Invitation and unconfirmed user account have been deleted."
          : "The invitation has been successfully deleted.",
      });

      setMembers(prev => prev.filter(m => m.invitationId !== invitationId));
      return true;
    } catch (err: any) {
      console.error("Error deleting invitation:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId }
      });

      if (error) {
        throw new Error(error.message || "Failed to delete user");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "User deleted",
        description: data?.message || "User has been successfully deleted.",
      });

      setMembers(prev => prev.filter(m => m.userId !== userId));
      return true;
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await invokeFunction('resend-invitation', {
        body: { invitation_id: invitationId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to resend invitation');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      toast({
        title: "Email Resent",
        description: `Activation email has been resent to ${data.email}`,
      });

      return true;
    } catch (err: any) {
      console.error("Error resending invitation:", err);
      toast({
        title: "Resend Failed",
        description: err.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, isAdmin: boolean): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: isAdmin })
        .eq("id", userId);

      if (error) {
        throw new Error(error.message || "Failed to update role");
      }

      toast({
        title: "Role updated",
        description: `User's role has been updated to ${isAdmin ? 'administrator' : 'regular user'}.`,
      });

      // Update local state
      setMembers(prev => prev.map(m => 
        m.userId === userId 
          ? { ...m, role: isAdmin ? 'admin' : 'user', isAdmin } 
          : m
      ));
      
      return true;
    } catch (err: any) {
      console.error("Error updating role:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    deleteInvitation,
    deleteUser,
    resendInvitation,
    updateUserRole,
  };
};
