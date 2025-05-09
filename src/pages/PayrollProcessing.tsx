
import React, { useState } from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { EmployeePayrollCalculator } from "@/components/payroll/EmployeePayrollCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollHistoryTable } from "@/components/payroll/PayrollHistoryTable";

const PayrollProcessing = () => {
  const [activeTab, setActiveTab] = useState<string>("calculator");

  return (
    <PageContainer title="Payroll Processing">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">UK Payroll Calculator (2025-2026)</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator">
            <EmployeePayrollCalculator />
          </TabsContent>
          
          <TabsContent value="history">
            <PayrollHistoryTable />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default PayrollProcessing;
