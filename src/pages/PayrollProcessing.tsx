
import React from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { EmployeePayrollCalculator } from "@/components/payroll/EmployeePayrollCalculator";

const PayrollProcessing = () => {
  return (
    <PageContainer title="Payroll Processing">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">UK Payroll Calculator</h1>
        
        <div className="mb-6">
          <EmployeePayrollCalculator />
        </div>
      </div>
    </PageContainer>
  );
};

export default PayrollProcessing;
