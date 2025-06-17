
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

interface GenderData {
  gender: string;
  count: number;
}

interface DashboardStats {
  totalEmployees: number;
  averageHireDate: string;
  departmentCount: number;
  averageAge: number | null;
}

export function useDashboardData(departmentColors: string[]) {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    averageHireDate: "-",
    departmentCount: 0,
    averageAge: null
  });
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [genderData, setGenderData] = useState<GenderData[]>([]);
  const [recentHires, setRecentHires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Get total employee count
        const { count, error: countError } = await supabase
          .from("employees")
          .select("*", { count: "exact", head: true });
        
        if (countError) throw countError;
        
        // Get department distribution
        const { data: deptData, error: deptError } = await supabase
          .from("employees")
          .select("department");
          
        if (deptError) throw deptError;
        
        // Get gender distribution - only for employees with gender specified
        const { data: genderRawData, error: genderError } = await supabase
          .from("employees")
          .select("gender")
          .not("gender", "is", null);
          
        if (genderError) throw genderError;
        
        // Get date of birth data for age calculation
        const { data: dobData, error: dobError } = await supabase
          .from("employees")
          .select("date_of_birth");
          
        if (dobError) throw dobError;
        
        // Get recent hires
        const { data: recentData, error: recentError } = await supabase
          .from("employees")
          .select("id, first_name, last_name, department, hire_date")
          .order("hire_date", { ascending: false })
          .limit(5);
          
        if (recentError) throw recentError;
        
        // Process department data
        const deptMap = new Map<string, number>();
        deptData?.forEach(emp => {
          const dept = emp.department;
          deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });
        
        const deptChartData: DepartmentData[] = [...deptMap.entries()]
          .map(([name, value], index) => ({
            name,
            value,
            color: departmentColors[index % departmentColors.length]
          }));
        
        // Process gender data - filter out null/undefined values and normalize
        const genderMap = new Map<string, number>();
        genderRawData?.forEach(emp => {
          if (emp.gender && emp.gender.trim() !== '') {
            // Normalize gender values to standard format
            const normalizedGender = emp.gender.toLowerCase().trim();
            let gender: string;
            
            if (normalizedGender === 'male' || normalizedGender === 'm') {
              gender = 'Male';
            } else if (normalizedGender === 'female' || normalizedGender === 'f') {
              gender = 'Female';
            } else if (normalizedGender === 'other') {
              gender = 'Other';
            } else if (normalizedGender === 'prefer not to say') {
              gender = 'Prefer not to say';
            } else {
              // For any other values, use the original value but capitalize first letter
              gender = emp.gender.charAt(0).toUpperCase() + emp.gender.slice(1).toLowerCase();
            }
            
            genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
          }
        });
        
        const genderChartData: GenderData[] = [...genderMap.entries()]
          .map(([gender, count]) => ({
            gender,
            count
          }));
          
        // Calculate average age from date of birth
        let totalAge = 0;
        let validDobCount = 0;
        
        dobData?.forEach(emp => {
          if (emp.date_of_birth) {
            const birthDate = new Date(emp.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            // Adjust age if birthday hasn't occurred yet this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            
            totalAge += age;
            validDobCount++;
          }
        });
        
        // Calculate average age (null if no valid DOBs)
        const averageAge = validDobCount > 0 ? Math.round(totalAge / validDobCount) : null;
          
        setDepartmentData(deptChartData);
        setGenderData(genderChartData);
        setRecentHires(recentData || []);
        setStats({
          totalEmployees: count || 0,
          averageHireDate: "-", // Could calculate average if needed
          departmentCount: deptMap.size,
          averageAge
        });
      } catch (error: any) {
        toast({
          title: "Error loading dashboard data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [toast, departmentColors]);

  return {
    stats,
    departmentData,
    genderData,
    recentHires,
    loading
  };
}
