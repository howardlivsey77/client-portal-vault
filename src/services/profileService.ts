
import { supabase } from "@/integrations/supabase/client";

export const ensureUserProfile = async (userId: string): Promise<void> => {
  try {
    console.log("Checking if user profile exists for:", userId);
    
    // First, let's try to get the user's information directly from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting user details:", userError);
      return;
    }
    
    // Check if profile exists - with better error handling
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    // If there's an error checking (like table doesn't exist), try to create it anyway
    if (checkError) {
      console.error("Error checking profile (table might not exist):", checkError);
      // Try to create the profile anyway - if table doesn't exist, this will also fail gracefully
    }
    
    if (!existingProfile) {
      console.log("Profile doesn't exist, attempting to create one...");
      
      // Attempt to create profile with better error handling
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          is_admin: false
        });
      
      if (createError) {
        console.error("Error creating profile:", createError);
        // Don't throw here - let the calling function continue
      } else {
        console.log("Profile created successfully");
      }
    } else {
      console.log("Profile already exists");
    }
  } catch (error) {
    console.error("Exception in ensureUserProfile:", error);
    // Don't throw - let the calling function continue
  }
};

// Alternative function that doesn't depend on profiles table
export const getUserFromAuth = async (): Promise<{ id: string; email: string } | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error("Error getting user from auth:", error);
      return null;
    }
    
    return {
      id: user.id,
      email: user.email || ''
    };
  } catch (error) {
    console.error("Exception getting user from auth:", error);
    return null;
  }
};
