
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { useEmployeeForm } from "@/hooks/useEmployeeForm";
import { EmployeeFormHeader } from "@/components/employees/form/EmployeeFormHeader";
import { EmployeeFormContainer } from "@/components/employees/form/EmployeeFormContainer";

const EmployeeForm = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  
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
  
  // Fetch employee data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchEmployeeData();
    }
  }, [isEditMode, fetchEmployeeData]);
  
  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
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
    </PageContainer>
  );
};

export default EmployeeForm;
