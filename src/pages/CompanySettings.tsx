
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CompanySettings = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Determine which section is active based on the URL
  const getActiveSectionFromPath = () => {
    if (currentPath.includes("/settings/company/holidays")) return "holidays";
    if (currentPath.includes("/settings/company/locations")) return "locations";
    if (currentPath.includes("/settings/company/departments")) return "departments";
    return "general"; // Default tab
  };

  return (
    <PageContainer>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-6">Company Settings</h1>
        
        <Tabs defaultValue={getActiveSectionFromPath()} className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Company Information</CardTitle>
                <CardDescription>
                  Configure your company's basic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is where you can manage your company's name, address, tax identifiers, and other general information.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="holidays">
            <Card>
              <CardHeader>
                <CardTitle>Company Holidays</CardTitle>
                <CardDescription>
                  Configure holidays and closures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is where you can manage company-wide holidays and closures.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Company Locations</CardTitle>
                <CardDescription>
                  Manage company office locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure and manage all your company's office locations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                  Manage company departments and divisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure departments, divisions, and team structures.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default CompanySettings;
