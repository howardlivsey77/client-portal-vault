
import { useState, useEffect } from "react";
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
  NhsPensionInfoCard,
  SalaryInfoCard,
  SicknessTrackingCard
} from "@/components/employees/details";
import { supabase } from "@/integrations/supabase/client";

interface SicknessScheme {
  id: string;
  name: string;
  eligibilityRules: any;
}

const EmployeeDetails = () => {
  const { id } = useParams();
  const [sicknessScheme, setSicknessScheme] = useState<SicknessScheme | null>(null);
  
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

  // Fetch sickness scheme when employee changes
  useEffect(() => {
    const fetchSicknessScheme = async () => {
      if (!employee?.sickness_scheme_id) {
        setSicknessScheme(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sickness_schemes')
          .select('id, name, eligibility_rules')
          .eq('id', employee.sickness_scheme_id)
          .single();

        if (error) throw error;

        if (data) {
          setSicknessScheme({
            id: data.id,
            name: data.name,
            eligibilityRules: data.eligibility_rules ? JSON.parse(data.eligibility_rules as string) : null
          });
        }
      } catch (error: any) {
        console.error("Error fetching sickness scheme:", error);
        setSicknessScheme(null);
      }
    };

    fetchSicknessScheme();
  }, [employee?.sickness_scheme_id]);
  
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
        {/* Left Column */}
        <PersonalInfoCard 
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
          canEdit={isAdmin}
        />
        
        {/* Right Column */}
        <ContactInfoCard 
          employee={employee} 
          formattedAddress={formattedAddress}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
          canEdit={isAdmin || isOwnRecord}
        />

        {/* Left Column */}
        <SalaryInfoCard 
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
          canEdit={isAdmin}
        />
        
        {/* Right Column */}
        <WorkPatternCard 
          employee={employee} 
          isAdmin={isAdmin}
          refetchEmployeeData={fetchEmployeeData}
          updateEmployeeField={updateEmployeeField}
        />

        {/* Left Column */}
        <SicknessTrackingCard
          employee={employee}
          sicknessScheme={sicknessScheme}
          isAdmin={isAdmin}
        />

        {/* Right Column */}
        <HmrcInfoCard
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
        />

        {/* Left Column */}
        <NhsPensionInfoCard
          employee={employee}
          isAdmin={isAdmin}
          updateEmployeeField={updateEmployeeField}
        />
        
        {/* Right Column */}
        <SystemInfoCard employee={employee} />
      </div>
    </PageContainer>
  );
};

export default EmployeeDetails;
