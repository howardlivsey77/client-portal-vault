
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

interface GenderData {
  name: string;
  value: number;
  color: string;
}

interface DashboardStats {
  totalEmployees: number;
  averageHireDate: string;
  departmentCount: number;
}

export function useDashboardData(departmentColors: string[]) {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    averageHireDate: "-",
    departmentCount: 0
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
        
        // Get gender distribution
        const { data: genderDistributionData, error: genderError } = await supabase
          .from("employees")
          .select("gender");
          
        if (genderError) throw genderError;
        
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
          
        // Process gender data
        const genderMap = new Map<string, number>();
        genderDistributionData?.forEach(emp => {
          // Handle nulls and standardize gender values
          const gender = emp.gender || "Not Specified";
          genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
        });
        
        const genderChartData: GenderData[] = [...genderMap.entries()]
          .map(([name, value], index) => ({
            name,
            value,
            color: name === "Male" ? "#3b82f6" : // blue for male
                  name === "Female" ? "#ec4899" : // pink for female
                  "#9ca3af" // gray for other/not specified
          }));
          
        setDepartmentData(deptChartData);
        setGenderData(genderChartData);
        setRecentHires(recentData || []);
        setStats({
          totalEmployees: count || 0,
          averageHireDate: "-", // Could calculate average if needed
          departmentCount: deptMap.size
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
