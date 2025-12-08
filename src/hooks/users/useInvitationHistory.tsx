import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InvitationResendLog {
  id: string;
  invitation_id: string;
  resent_by: string;
  resent_at: string;
  success: boolean;
  error_message: string | null;
  resend_method: string;
  resent_by_profile?: {
    email: string;
    full_name: string;
  };
}

export const useInvitationHistory = (invitationId: string) => {
  return useQuery({
    queryKey: ['invitation-history', invitationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitation_resend_log')
        .select('*')
        .eq('invitation_id', invitationId)
        .order('resent_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(log => log.resent_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return data.map(log => ({
          ...log,
          resent_by_profile: profileMap.get(log.resent_by)
        })) as InvitationResendLog[];
      }
      
      return data as InvitationResendLog[];
    },
    enabled: !!invitationId,
  });
};
