
import { useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { useEmployeeDetails } from "@/hooks";
import { 
  EmployeeHeader,
  PersonalInfoCard,
  ContactInfoCard,
  SystemInfoCard,
  WorkPatternCard,
  EmployeeNotFound,
  LoadingState,
  HmrcInfoCard,
  EmploymentStatusCard,
  NhsPensionInfoCard
} from "@/components/employees/details";

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
    updateEmployeeField,
    isOwnRecord
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
          canEdit={isAdmin}
        />
        
        <ContactInfoCard 
          employee={employee} 
          formattedAddress={formattedAddress}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
          canEdit={isAdmin || isOwnRecord}
        />
        
        <HmrcInfoCard
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
        />

        <NhsPensionInfoCard
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
