
import { supabase } from "@/integrations/supabase/client";

export const ensureUserProfile = async (userId: string): Promise<void> => {
  try {
    console.log("Checking if user profile exists for:", userId);
    
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking profile:", checkError);
      return;
    }
    
    if (!existingProfile) {
      console.log("Profile doesn't exist, creating one...");
      
      // Get user details from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Error getting user details:", userError);
        return;
      }
      
      // Create profile
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
      } else {
        console.log("Profile created successfully");
      }
    } else {
      console.log("Profile already exists");
    }
  } catch (error) {
    console.error("Exception in ensureUserProfile:", error);
  }
};
