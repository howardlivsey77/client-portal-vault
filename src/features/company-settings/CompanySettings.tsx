
import { useLocation } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettingsTab from "./tabs/GeneralSettingsTab";
import SicknessSettingsTab from "./tabs/SicknessSettingsTab";
import LocationsSettingsTab from "./tabs/LocationsSettingsTab";
import DepartmentsSettingsTab from "./tabs/DepartmentsSettingsTab";
import OvertimeRatesSettingsTab from "./tabs/OvertimeRatesSettingsTab";
import HolidaysSettingsTab from "./tabs/HolidaysSettingsTab";
import { CostCentresSettingsTab } from "./tabs/CostCentresSettingsTab";

const CompanySettings = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Determine which section is active based on the URL
  const getActiveSectionFromPath = () => {
    if (currentPath.includes("/settings/company/sickness")) return "sickness";
    if (currentPath.includes("/settings/company/locations")) return "locations";
    if (currentPath.includes("/settings/company/departments")) return "departments";
    if (currentPath.includes("/settings/company/overtime")) return "overtime";
    if (currentPath.includes("/settings/company/holidays")) return "holidays";
    if (currentPath.includes("/settings/company/cost-centres")) return "cost-centres";
    return "general"; // Default tab
  };

  return (
    <PageContainer>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-6">Company Settings</h1>
        
        <Tabs defaultValue={getActiveSectionFromPath()} className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="sickness">Sickness</TabsTrigger>
            <TabsTrigger value="overtime">Overtime Rates</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="cost-centres">Cost Centres</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <GeneralSettingsTab />
          </TabsContent>
          
          <TabsContent value="sickness">
            <SicknessSettingsTab />
          </TabsContent>
          
          <TabsContent value="overtime">
            <OvertimeRatesSettingsTab />
          </TabsContent>
          
          <TabsContent value="holidays">
            <HolidaysSettingsTab />
          </TabsContent>
          
          <TabsContent value="locations">
            <LocationsSettingsTab />
          </TabsContent>
          
          <TabsContent value="departments">
            <DepartmentsSettingsTab />
          </TabsContent>
          
          <TabsContent value="cost-centres">
            <CostCentresSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default CompanySettings;
