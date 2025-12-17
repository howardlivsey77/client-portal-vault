import { CompanyOverviewCard } from "./CompanyOverviewCard";
import { DepartmentDistributionCard } from "./DepartmentDistributionCard";
import { HmrcDashboardCard } from "./HmrcDashboardCard";
import { PayrollSummaryCard } from "./PayrollSummaryCard";
import { useDashboardData } from "@/hooks";
import { useBrandColors } from "@/brand";

export function EmployeeDashboard() {
  const brandColors = useBrandColors();
  const { stats, departmentData, genderData, loading } = useDashboardData(brandColors.chartColors);

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="monday-section-title">Company Overview</h2>
      
      {/* Grid for summary tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PayrollSummaryCard />
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
