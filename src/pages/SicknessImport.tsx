import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, Home, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Link, useNavigate } from "react-router-dom";
import { SicknessImportCore } from "@/components/employees/sickness-import/SicknessImportCore";

const SicknessImport = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/employees');
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/employees" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Employees
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Sickness Import</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employees')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold">Sickness Import</h1>
            <p className="text-muted-foreground">Import employee sickness records from Excel or CSV files</p>
          </div>
        </div>

        <SicknessImportCore 
          mode="standalone" 
          onComplete={handleComplete}
        />
      </div>
    </PageContainer>
  );
};

export default SicknessImport;