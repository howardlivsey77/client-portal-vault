import { supabase } from "@/integrations/supabase/client";

export const fetchAdjacentEmployees = async (
  lastName: string, 
  firstName: string, 
  currentId: string
): Promise<{ 
  nextEmployeeId: string | null; 
  prevEmployeeId: string | null; 
}> => {
  let nextEmployeeId = null;
  let prevEmployeeId = null;
  
  try {
    // Fetch next employee (alphabetically by last name, then first name)
    const { data: nextData, error: nextError } = await supabase
      .from("employees")
      .select("id")
      .or(`last_name.gt.${lastName},and(last_name.eq.${lastName},first_name.gt.${firstName})`)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
      .limit(1);
    
    if (!nextError && nextData && nextData.length > 0) {
      nextEmployeeId = nextData[0].id;
    }
    
    // Fetch previous employee
    const { data: prevData, error: prevError } = await supabase
      .from("employees")
      .select("id")
      .or(`last_name.lt.${lastName},and(last_name.eq.${lastName},first_name.lt.${firstName})`)
      .order('last_name', { ascending: false })
      .order('first_name', { ascending: false })
      .limit(1);
    
    if (!prevError && prevData && prevData.length > 0) {
      prevEmployeeId = prevData[0].id;
    }
  } catch (error) {
    console.error("Error fetching adjacent employees:", error);
  }

  return { nextEmployeeId, prevEmployeeId };
};
