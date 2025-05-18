
import { supabase } from "@/integrations/supabase/client";

// Function to make sure user has access to at least one company
export const ensureCompanyAccess = async (userId: string): Promise<void> => {
  try {
    // Check if the user already has company access
    const { data: accessData } = await supabase
      .from('company_access')
      .select('company_id')
      .eq('user_id', userId);

    // If user doesn't have any company access, assign to default company
    if (!accessData || accessData.length === 0) {
      // Get the default company (first one created)
      const { data: defaultCompany } = await supabase
        .from('companies')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (defaultCompany) {
        // Assign user to default company with 'user' role
        await supabase
          .from('company_access')
          .insert({
            user_id: userId,
            company_id: defaultCompany.id,
            role: 'user'
          });

        console.log("User assigned to default company");
      }
    }
  } catch (error) {
    console.error("Error ensuring company access:", error);
    // We don't stop the authentication flow if this fails
  }
};
