
import { useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { useEmployeeDetails } from "@/hooks/useEmployeeDetails";
import { EmployeeHeader } from "@/components/employees/details/EmployeeHeader";
import { PersonalInfoCard } from "@/components/employees/details/PersonalInfoCard";
import { ContactInfoCard } from "@/components/employees/details/ContactInfoCard";
import { SystemInfoCard } from "@/components/employees/details/SystemInfoCard";
import { EmployeeNotFound } from "@/components/employees/details/EmployeeNotFound";
import { LoadingState } from "@/components/employees/details/LoadingState";

const EmployeeDetails = () => {
  const { id } = useParams();
  const { 
    employee, 
    loading, 
    isAdmin,
    formattedAddress,
    deleteEmployee 
  } = useEmployeeDetails(id);
  
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }
  
  if (!employee) {
    return (
      <PageContainer>
        <EmployeeNotFound />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <EmployeeHeader 
        employee={employee} 
        isAdmin={isAdmin} 
        deleteEmployee={deleteEmployee} 
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInfoCard employee={employee} />
        <ContactInfoCard employee={employee} formattedAddress={formattedAddress} />
        <SystemInfoCard employee={employee} />
      </div>
    </PageContainer>
  );
};

export default EmployeeDetails;
