
import { useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { useEmployeeDetails, useSicknessScheme } from "@/hooks";
import { 
  EmployeeHeader,
  PersonalInfoCard,
  ContactInfoCard,
  SystemInfoCard,
  WorkPatternCard,
  EmployeeNotFound,
  LoadingState,
  HmrcInfoCard,
  NhsPensionInfoCard,
  SalaryInfoCard,
  SicknessTrackingCard
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

  const { sicknessScheme } = useSicknessScheme(employee?.sickness_scheme_id);
  
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
        nextEmployeeId={nextEmployeeId}
        prevEmployeeId={prevEmployeeId}
        navigateToEmployee={navigateToEmployee}
        deleteEmployee={deleteEmployee} 
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInfoCard 
          employee={employee}
          updateEmployeeField={updateEmployeeField}
        />
        
        <ContactInfoCard 
          employee={employee} 
          formattedAddress={formattedAddress}
          updateEmployeeField={updateEmployeeField}
          isOwnRecord={isOwnRecord}
        />

        <SalaryInfoCard 
          employee={employee}
          updateEmployeeField={updateEmployeeField}
        />
        
        <WorkPatternCard 
          employee={employee} 
          refetchEmployeeData={fetchEmployeeData}
          updateEmployeeField={updateEmployeeField}
        />

        <SicknessTrackingCard
          employee={employee}
          sicknessScheme={sicknessScheme}
        />

        <HmrcInfoCard
          employee={employee}
          updateEmployeeField={updateEmployeeField}
        />

        <NhsPensionInfoCard
          employee={employee}
          updateEmployeeField={updateEmployeeField}
        />
        
        <SystemInfoCard employee={employee} />
      </div>
    </PageContainer>
  );
};

export default EmployeeDetails;
