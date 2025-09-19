
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InvitationMetadata {
  id: string;
  invited_email: string;
  invited_by: string;
  company_id: string;
  role: string;
  created_at: string;
  accepted_at: string | null;
  is_accepted: boolean;
}

export const useInvites = () => {
  const [invitations, setInvitations] = useState<InvitationMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use admin-gated RPC to fetch invitation metadata
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        // wait until auth is ready without surfacing an error
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_invitation_metadata', { _user_id: userId, _company_id: null });
        
      if (error) {
        console.error("Invitation metadata fetch error:", error);
        throw error;
      }
      
      console.log("Invitation metadata:", data);
      
      setInvitations(data || []);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      
      // Handle permission errors gracefully
      if (error.message && error.message.includes("permission denied")) {
        setError("Permission denied: You don't have access to view invitations.");
        toast({
          title: "Error fetching invitations",
          description: "Permission denied: You don't have access to view invitations.",
          variant: "destructive"
        });
      } else {
        setError(error.message || "An error occurred while fetching invitations.");
        toast({
          title: "Error fetching invitations",
          description: error.message,
          variant: "destructive"
        });
      }
      
      // Set empty invitations array in case of error
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };
  
  const createInvitation = async (email: string, selectedRole: string, userId: string | null, companyId: string | null) => {
    setLoading(true);
    
    try {
      if (!email.trim()) {
        toast({
          title: "Email required",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return false;
      }
      if (!companyId) {
        toast({
          title: "Company required",
          description: "Please select a company for this invitation.",
          variant: "destructive"
        });
        return false;
      }

      // Use Supabase native invitation system via edge function
      const { data, error } = await supabase.functions.invoke('admin-invite', {
        body: {
          email: email.toLowerCase().trim(),
          company_id: companyId,
          role: selectedRole,
          redirect_to: 'https://payroll.dootsons.com/auth'
        }
      });

      if (error) {
        console.error("Admin invite error:", error);
        throw new Error(error.message || 'Failed to send invitation');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email} with ${selectedRole} role using Supabase native auth`,
      });

      await fetchInvitations();
      return true;
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      
      if (error.message.includes("already has an active invitation")) {
        toast({
          title: "Duplicate invitation",
          description: "This email already has an active invitation for this company.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error creating invitation",
          description: error.message,
          variant: "destructive"
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteInvitation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('invitation_metadata')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Invitation deleted",
        description: "The invitation has been successfully deleted.",
      });
      
      // Update the invitations list
      setInvitations(invitations.filter(invite => invite.id !== id));
    } catch (error: any) {
      toast({
        title: "Error deleting invitation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInvitations();
  }, []);
  
  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    createInvitation,
    deleteInvitation
  };
};
