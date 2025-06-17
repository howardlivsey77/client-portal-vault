
import { supabase } from "@/integrations/supabase/client";
import { getUserFromAuth } from "./profileService";

// Function to make sure user has access to at least one company
export const ensureCompanyAccess = async (userId: string): Promise<void> => {
  try {
    console.log("Ensuring company access for user:", userId);
    
    // Check if the user already has company access
    const { data: accessData, error: accessError } = await supabase
      .from('company_access')
      .select('company_id')
      .eq('user_id', userId);

    if (accessError) {
      console.error("Error checking company access:", accessError);
      return; // Don't block auth flow on error
    } else {
      console.log("User company access data:", accessData);
    }

    // If user doesn't have any company access, assign to default company
    if (!accessData || accessData.length === 0) {
      console.log("No company access found, getting default company");
      
      // Get the default company (first one created)
      const { data: defaultCompany, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (companyError) {
        console.error("Error getting default company:", companyError);
        return; // Don't block auth flow if no default company exists
      } else {
        console.log("Default company found:", defaultCompany);
      }

      if (defaultCompany) {
        // Assign user to default company with user role (not admin by default)
        console.log(`Assigning user ${userId} to default company ${defaultCompany.id} with role user`);
        
        const { error: insertError } = await supabase
          .from('company_access')
          .insert({
            user_id: userId,
            company_id: defaultCompany.id,
            role: 'user' // Default role for auto-assigned users
          });

        if (insertError) {
          console.error("Error assigning user to default company:", insertError);
        } else {
          console.log("User assigned to default company successfully");
        }
      } else {
        console.log("No default company found - user will need to create one");
      }
    } else {
      console.log(`User ${userId} already has company access, skipping assignment`);
    }
  } catch (error) {
    console.error("Error ensuring company access:", error);
    // We don't stop the authentication flow if this fails
  }
};

// Function to manually create company access for a user
export const createCompanyAccess = async (userId: string, companyId: string, role: string = 'user'): Promise<boolean> => {
  try {
    console.log("Creating company access for user:", userId, "to company:", companyId, "with role:", role);
    
    // First check if access already exists
    const { data: existingAccess, error: checkError } = await supabase
      .from('company_access')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId);
    
    if (checkError) {
      console.error("Error checking existing company access:", checkError);
    } else if (existingAccess && existingAccess.length > 0) {
      console.log("User already has access to this company. Updating role if needed.");
      
      // If role is different, update it
      if (existingAccess[0].role !== role) {
        const { error: updateError } = await supabase
          .from('company_access')
          .update({ role })
          .eq('user_id', userId)
          .eq('company_id', companyId);
        
        if (updateError) {
          console.error("Error updating company access role:", updateError);
          return false;
        }
        
        console.log("Company access role updated successfully to:", role);
      }
      
      return true;
    }
    
    // Create new access record if one doesn't exist
    const { error } = await supabase
      .from('company_access')
      .insert({
        user_id: userId,
        company_id: companyId,
        role: role
      });
    
    if (error) {
      console.error("Error creating company access:", error);
      return false;
    }
    
    console.log("Company access created successfully");
    return true;
  } catch (error) {
    console.error("Exception creating company access:", error);
    return false;
  }
};
