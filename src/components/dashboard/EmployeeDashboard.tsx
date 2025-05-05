
import { EmployeeOverview } from "./EmployeeOverview";
import { DepartmentDistribution } from "./DepartmentDistribution";
import { RecentHires } from "./RecentHires";
import { useDashboardData } from "@/hooks/useDashboardData";

const DEPARTMENT_COLORS = [
  "#9b87f5", "#7E69AB", "#8B5CF6", "#D946EF", "#F97316", 
  "#0EA5E9", "#1EAEDB", "#33C3F0", "#0FA0CE"
];

export function EmployeeDashboard() {
  const { stats, departmentData, recentHires, loading } = useDashboardData(DEPARTMENT_COLORS);

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <EmployeeOverview 
        totalEmployees={stats.totalEmployees}
        departmentCount={stats.departmentCount}
        departmentData={departmentData}
      />
      <DepartmentDistribution departmentData={departmentData} />
      <RecentHires recentHires={recentHires} />
    </div>
  );
}
