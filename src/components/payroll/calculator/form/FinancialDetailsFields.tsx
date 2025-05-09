
import { PayrollFormValues } from "../types";
import { SalaryField } from "./SalaryField";
import { TaxCodeField } from "./TaxCodeField";
import { TaxRegionField } from "./TaxRegionField";
import { PensionField } from "./PensionField";
import { StudentLoanField } from "./StudentLoanField";
import { NicCodeField } from "./NicCodeField";
import { TaxYearField } from "./TaxYearField";
import { TaxOptions } from "./TaxOptions";

interface FinancialDetailsFieldsProps {
  formValues: PayrollFormValues;
  onInputChange: (field: keyof PayrollFormValues, value: any) => void;
  onNumberInputChange: (field: keyof PayrollFormValues, value: string) => void;
}

export function FinancialDetailsFields({
  formValues,
  onInputChange,
  onNumberInputChange
}: FinancialDetailsFieldsProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Financial Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SalaryField 
          monthlySalary={formValues.monthlySalary} 
          onNumberInputChange={onNumberInputChange} 
        />
        
        <TaxCodeField 
          taxCode={formValues.taxCode} 
          onInputChange={onInputChange} 
        />

        <TaxRegionField 
          taxRegion={formValues.taxRegion || 'UK'} 
          onInputChange={onInputChange} 
        />

        <PensionField 
          pensionPercentage={formValues.pensionPercentage} 
          onNumberInputChange={onNumberInputChange} 
        />

        <StudentLoanField 
          studentLoanPlan={formValues.studentLoanPlan} 
          onInputChange={onInputChange} 
        />
        
        <NicCodeField 
          nicCode={formValues.nicCode || 'A'} 
          onInputChange={onInputChange} 
        />
        
        <TaxYearField 
          taxYear={formValues.taxYear || ''} 
          onInputChange={onInputChange} 
        />
      </div>
      
      <TaxOptions 
        useEmergencyTax={formValues.useEmergencyTax || false}
        isNewEmployee={formValues.isNewEmployee || false}
        onInputChange={onInputChange}
      />
    </div>
  );
}
