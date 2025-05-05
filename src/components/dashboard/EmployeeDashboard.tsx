
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartPie } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

interface DashboardStats {
  totalEmployees: number;
  averageHireDate: string;
  departmentCount: number;
}

const DEPARTMENT_COLORS = [
  "#9b87f5", "#7E69AB", "#8B5CF6", "#D946EF", "#F97316", 
  "#0EA5E9", "#1EAEDB", "#33C3F0", "#0FA0CE"
];

export function EmployeeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    averageHireDate: "-",
    departmentCount: 0
  });
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
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
            color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]
          }));
          
        setDepartmentData(deptChartData);
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
  }, [toast]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-0.5">
            <CardTitle>Employee Overview</CardTitle>
            <CardDescription>Summary of your workforce</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-sm font-medium">Total Employees</div>
              <div className="font-bold">{stats.totalEmployees}</div>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-sm font-medium">Departments</div>
              <div className="font-bold">{stats.departmentCount}</div>
            </div>
            <div className="pt-2">
              <div className="text-sm font-medium mb-2">Department Distribution</div>
              <div className="grid grid-cols-2 gap-2">
                {departmentData.map((dept) => (
                  <Badge key={dept.name} variant="outline" className="justify-between">
                    <span className="truncate">{dept.name}</span>
                    <span className="ml-2">{dept.value}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
          <CardDescription>Employees by department</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ChartContainer className="h-[200px] w-full max-w-md" config={{
            departments: { label: "Departments" }
          }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={departmentData} 
                  dataKey="value"
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={30}
                  outerRadius={80} 
                  paddingAngle={2}
                  label
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ChartLegend>
              <ChartLegendContent payload={departmentData.map((item) => ({
                value: item.name,
                color: item.color,
                dataKey: item.name
              }))} />
            </ChartLegend>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Hires</CardTitle>
          <CardDescription>Latest employees to join</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Hire Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentHires.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{formatDate(employee.hire_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
