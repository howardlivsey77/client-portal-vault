
import { useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { useEmployeeDetails } from "@/hooks/useEmployeeDetails";
import { EmployeeHeader } from "@/components/employees/details/EmployeeHeader";
import { PersonalInfoCard } from "@/components/employees/details";
import { ContactInfoCard } from "@/components/employees/details/contact-info/ContactInfoCard";
import { SystemInfoCard } from "@/components/employees/details/SystemInfoCard";
import { WorkPatternCard } from "@/components/employees/details/WorkPatternCard";
import { EmployeeNotFound } from "@/components/employees/details/EmployeeNotFound";
import { LoadingState } from "@/components/employees/details/LoadingState";
import { HmrcInfoCard } from "@/components/employees/details/hmrc-info/HmrcInfoCard";
import { EmploymentStatusCard } from "@/components/employees/details/employment-status/EmploymentStatusCard";

const EmployeeDetails = () => {
  const { id } = useParams();
  const { 
    employee, 
    loading, 
    isAdmin,
    formattedAddress,
    nextEmployeeId,
    prevEmployeeId,
    navigateToEmployee,
    deleteEmployee,
    fetchEmployeeData,
    updateEmployeeField
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
        nextEmployeeId={nextEmployeeId}
        prevEmployeeId={prevEmployeeId}
        navigateToEmployee={navigateToEmployee}
        deleteEmployee={deleteEmployee} 
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInfoCard 
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
        />
        
        <ContactInfoCard 
          employee={employee} 
          formattedAddress={formattedAddress}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField} 
        />
        
        <HmrcInfoCard
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
        />

        <EmploymentStatusCard 
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
        />
        
        <WorkPatternCard 
          employee={employee} 
          isAdmin={isAdmin}
          refetchEmployeeData={fetchEmployeeData}
          updateEmployeeField={updateEmployeeField}
        />
        
        <SystemInfoCard employee={employee} />
      </div>
    </PageContainer>
  );
};

export default EmployeeDetails;
