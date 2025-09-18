
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Invitation {
  id: string;
  email: string;
  invite_code: string;
  issued_at: string;
  expires_at: string;
  is_accepted: boolean;
  accepted_at: string | null;
  role: string;
  issued_by: string;
  company_id?: string;
}

export const useInvites = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use admin-gated RPC to fetch invitations
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        // wait until auth is ready without surfacing an error
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_invitations', { _user_id: userId, _company_id: null });
        
      if (error) {
        console.error("Invitations fetch error:", error);
        throw error;
      }
      
      console.log("Invitations data:", data);
      
      // Ensure all invitations have a role property (use default 'user' if none exists)
      const invitationsWithRole = data?.map(invitation => ({
        ...invitation,
        role: invitation.role || 'user'
      })) || [];
      
      setInvitations(invitationsWithRole);
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
      
      // Generate random invite code
      const inviteCode = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const { data: createData, error } = await supabase
        .rpc('create_invitation', {
          _user_id: userId,
          _email: email.toLowerCase().trim(),
          _invite_code: inviteCode,
          _company_id: companyId,
          _expires_at: expiresAt.toISOString(),
          _role: selectedRole
        });
      
      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Duplicate invitation",
            description: "This email already has an active invitation.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return false;
        } else {
          // Send invitation email using edge function with service role key
          try {
            const payload = {
              email: email.toLowerCase().trim(),
              inviteCode,
              role: selectedRole,
              companyId: companyId
            };
            
            console.log("=== FRONTEND DEBUGGING (ENHANCED) ===");
            console.log("Current window.location:", window.location.href);
            console.log("Current origin:", window.location.origin);
            console.log("Is custom domain:", window.location.origin.includes('payroll.dootsons.com'));
            console.log("User agent:", navigator.userAgent);
            console.log("Invites: sending payload to send-invitation-email:", payload);
            
            const { data: sendData, error: sendError } = await supabase.functions.invoke('send-invitation-email', {
              body: payload
            });
            
            console.log("Edge function response:", { sendData, sendError });

            if (sendError) {
              console.error("send-invitation-email error:", sendError);
              let detail = '';
              let setupInstructions = '';
              const ctxBody = (sendError as any)?.context?.body;
              
              try {
                const parsed = typeof ctxBody === 'string' ? JSON.parse(ctxBody) : ctxBody;
                detail = parsed?.user_message || parsed?.error || parsed?.message || '';
                setupInstructions = parsed?.setup_instructions || '';
              } catch {
                detail = typeof ctxBody === 'string' ? ctxBody : sendError.message;
              }
              
              // Show user-friendly error message with setup instructions
              const description = detail || sendError.message;
              const fullMessage = setupInstructions 
                ? `${description}\n\nSetup: ${setupInstructions}`
                : description;
              
              toast({
                title: "Invitation created (email not sent)",
                description: fullMessage,
                variant: "destructive"
              });
            } else {
              toast({
                title: "Invitation created",
                description: `Invitation sent to ${email} with ${selectedRole} role`,
              });
            }
          } catch (e: any) {
            console.error("Error sending invite email:", e);
            const message = e?.message ?? "Invite created, but email sending failed.";
            toast({
              title: "Invitation created (email not sent)",
              description: message,
              variant: "destructive"
            });
          }
          await fetchInvitations();
          return true;
        }
    } catch (error: any) {
      toast({
        title: "Error creating invitation",
        description: error.message,
        variant: "destructive"
      });
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
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: deletedOk, error } = await supabase
        .rpc('delete_invitation', { _user_id: userId, _id: id });
      
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
