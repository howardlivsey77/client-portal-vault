
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/providers/AuthProvider";
import { useCompany } from "@/providers/CompanyProvider";
import { Loader2 } from "lucide-react";
import { useEmployeeForm } from "@/hooks/useEmployeeForm";
import { EmployeeFormHeader } from "@/components/employees/form/EmployeeFormHeader";
import { EmployeeFormContainer } from "@/components/employees/form/EmployeeFormContainer";
import { EmployeeFormErrorBoundary } from "@/components/employees/form/EmployeeFormErrorBoundary";

const EmployeeForm = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { currentCompany, isLoading: companyLoading } = useCompany();
  
  const {
    form,
    loading,
    isEditMode,
    readOnly,
    submitLoading,
    setReadOnly,
    fetchEmployeeData,
    onSubmit
  } = useEmployeeForm(id);
  
  // Set initial read-only status based on admin rights
  useEffect(() => {
    setReadOnly(!isAdmin);
  }, [isAdmin, setReadOnly]);
  
  console.log("EmployeeForm: companyLoading:", companyLoading, "currentCompany:", currentCompany?.id, "loading:", loading);
  
  // Show loading while company or employee data is loading
  if (companyLoading || loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            {companyLoading ? "Loading company..." : "Loading employee..."}
          </span>
        </div>
      </PageContainer>
    );
  }
  
  // Show message if no company is available
  if (!currentCompany) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="text-center">
            <p className="text-muted-foreground">No company selected</p>
            <p className="text-sm text-muted-foreground mt-2">Please select a company to continue</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <EmployeeFormErrorBoundary onReset={() => window.location.reload()}>
        <EmployeeFormHeader isEditMode={isEditMode} readOnly={readOnly} />
        
        <EmployeeFormContainer
          form={form}
          isAdmin={isAdmin}
          isEditMode={isEditMode}
          readOnly={readOnly}
          submitLoading={submitLoading}
          employeeId={id}
          onSubmit={onSubmit}
          setReadOnly={setReadOnly}
        />
      </EmployeeFormErrorBoundary>
    </PageContainer>
  );
};

export default EmployeeForm;
