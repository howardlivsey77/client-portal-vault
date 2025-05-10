
import React, { useState } from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { EmployeePayrollCalculator } from "@/components/payroll/EmployeePayrollCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENT_FINANCIAL_YEAR, CURRENT_PAY_PERIOD, PayPeriod } from "@/services/payroll/utils/financial-year-utils";

const PayrollProcessing = () => {
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod>(CURRENT_PAY_PERIOD);

  return (
    <PageContainer title="Payroll Processing">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">UK Payroll Processing</h1>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Financial Year:</span>
            <span className="font-medium">{CURRENT_FINANCIAL_YEAR.description}</span>
            
            <span className="text-sm text-muted-foreground ml-4">Pay Period:</span>
            <Select 
              value={selectedPayPeriod.periodNumber.toString()} 
              onValueChange={(value) => {
                const period = CURRENT_FINANCIAL_YEAR.periods.find(p => p.periodNumber === parseInt(value));
                if (period) setSelectedPayPeriod(period);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {CURRENT_FINANCIAL_YEAR.periods.map((period) => (
                  <SelectItem key={period.periodNumber} value={period.periodNumber.toString()}>
                    {period.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="calculator" className="mb-6">
          <TabsList>
            <TabsTrigger value="calculator">Employee Calculator</TabsTrigger>
            <TabsTrigger value="batch">Batch Processing</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator">
            <Card>
              <CardHeader>
                <CardTitle>Employee Payroll Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <EmployeePayrollCalculator payPeriod={selectedPayPeriod} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="batch">
            <Card>
              <CardHeader>
                <CardTitle>Batch Payroll Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Batch processing features will be added here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Payroll reports will be added here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default PayrollProcessing;
