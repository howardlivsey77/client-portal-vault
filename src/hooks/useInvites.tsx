
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
        // Generate invitation URL for manual sharing
        const inviteUrl = `${window.location.origin}/accept-invitation?code=${inviteCode}`;

        // Try direct Mailgun email sending first
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invitation-email-direct', {
            body: {
              email: email.toLowerCase().trim(),
              inviteCode,
              role: selectedRole,
              companyName: 'the company',
              companyId
            }
          });

          if (emailError) {
            throw emailError;
          }

          toast({
            title: "Invitation Sent",
            description: `Invitation sent successfully to ${email}`,
          });
        } catch (emailError) {
          console.error('Direct email sending failed:', emailError);
          
          // Show copy-paste dialog with invitation URL
          const userChoice = window.confirm(
            `Email sending failed. Would you like to copy the invitation link to send manually?\n\nLink: ${inviteUrl}\n\nClick OK to copy to clipboard, or Cancel to continue without copying.`
          );
          
          if (userChoice) {
            try {
              await navigator.clipboard.writeText(inviteUrl);
              toast({
                title: "Link Copied",
                description: "Invitation link copied to clipboard. Please send it manually via email.",
              });
            } catch (clipboardError) {
              // Fallback for browsers that don't support clipboard API
              const textArea = document.createElement('textarea');
              textArea.value = inviteUrl;
              textArea.style.position = 'fixed';
              textArea.style.left = '-999999px';
              textArea.style.top = '-999999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              
              try {
                document.execCommand('copy');
                toast({
                  title: "Link Copied",
                  description: "Invitation link copied to clipboard. Please send it manually via email.",
                });
              } catch (fallbackError) {
                toast({
                  title: "Invitation Created",
                  description: `Copy this link manually: ${inviteUrl}`,
                  variant: "destructive",
                });
              }
              
              document.body.removeChild(textArea);
            }
          } else {
            toast({
              title: "Invitation Created",
              description: `Email failed. Manual link: ${inviteUrl}`,
              variant: "destructive",
            });
          }
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
