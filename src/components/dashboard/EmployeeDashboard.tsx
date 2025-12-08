import { CompanyOverviewCard } from "./CompanyOverviewCard";
import { DepartmentDistributionCard } from "./DepartmentDistributionCard";
import { HmrcDashboardCard } from "./HmrcDashboardCard";
import { useDashboardData } from "@/hooks/useDashboardData";

const DEPARTMENT_COLORS = [
  "#9b87f5", "#7E69AB", "#8B5CF6", "#D946EF", "#F97316", 
  "#0EA5E9", "#1EAEDB", "#33C3F0", "#0FA0CE"
];

export function EmployeeDashboard() {
  const { stats, departmentData, genderData, loading } = useDashboardData(DEPARTMENT_COLORS);

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="monday-section-title">Company Overview</h2>
      
      {/* Grid for HMRC tile and future tile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Placeholder for future tile on the left */}
        <div className="hidden lg:block" />
        
        {/* HMRC tile on the right */}
        <HmrcDashboardCard />
      </div>

      <CompanyOverviewCard 
        totalEmployees={stats.totalEmployees}
        genderData={genderData}
        averageAge={stats.averageAge}
        averageLengthOfService={stats.averageLengthOfService}
      />
      <DepartmentDistributionCard
        departmentCount={stats.departmentCount}
        departmentData={departmentData}
      />
    </div>
  );
}
