import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/common/use-toast";
import type { Employee } from "@/types/employee-types";

export const useEmployeeInvite = () => {
  const [loading, setLoading] = useState(false);

  const sendInvite = async (employee: Employee, companyId: string): Promise<boolean> => {
    if (!employee.email) {
      toast({
        title: "Email Required",
        description: "Employee must have an email address to receive an invitation",
        variant: "destructive",
      });
      return false;
    }

    if (employee.portal_access_enabled) {
      toast({
        title: "Already Active",
        description: "This employee already has portal access",
        variant: "destructive",
      });
      return false;
    }

    const isResend = !!employee.invitation_sent_at;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-employee', {
        body: {
          employeeId: employee.id,
          companyId: companyId,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: isResend ? "Invitation Resent" : "Invitation Sent",
          description: `Portal invitation has been ${isResend ? 'resent' : 'sent'} to ${employee.email}`,
        });
        return true;
      } else {
        throw new Error(data.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      console.error('Error sending employee invite:', error);
      toast({
        title: "Failed to Send Invitation",
        description: error.message || "An error occurred while sending the invitation",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInvitationStatus = (employee: Employee): {
    status: 'not_invited' | 'invited' | 'active';
    label: string;
    variant: 'secondary' | 'outline' | 'default';
  } => {
    if (employee.portal_access_enabled) {
      return {
        status: 'active',
        label: 'Portal Active',
        variant: 'default',
      };
    }
    
    if (employee.invitation_sent_at) {
      return {
        status: 'invited',
        label: 'Invitation Sent',
        variant: 'outline',
      };
    }

    return {
      status: 'not_invited',
      label: 'Not Invited',
      variant: 'secondary',
    };
  };

  return {
    sendInvite,
    getInvitationStatus,
    loading,
  };
};
