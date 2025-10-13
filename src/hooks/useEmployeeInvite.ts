import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useEmployeeInvite() {
  const [loading, setLoading] = useState(false);

  const sendInvite = async (employeeId: string, email: string, companyId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-employee', {
        body: {
          employeeId,
          email,
          companyId,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Invitation sent",
        description: "The employee will receive an email with instructions to create their account.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending employee invite:', error);
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendInvite,
    loading,
  };
}
