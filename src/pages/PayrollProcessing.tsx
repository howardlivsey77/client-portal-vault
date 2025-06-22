
import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { EmployeePayrollCalculator } from "@/components/payroll/EmployeePayrollCalculator";
import { PayrollInputWizard } from "@/components/payroll/PayrollInputWizard";
import { PayrollErrorBoundary } from "@/components/payroll/PayrollErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { 
  AVAILABLE_FINANCIAL_YEARS, 
  PayPeriod, 
  FinancialYear,
  CURRENT_FINANCIAL_YEAR,
  CURRENT_PAY_PERIOD
} from "@/services/payroll/utils/financial-year-utils";

const PayrollProcessing = () => {
  // State for financial year and pay period
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<FinancialYear>(CURRENT_FINANCIAL_YEAR);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod>(CURRENT_PAY_PERIOD);
  const [showWizard, setShowWizard] = useState(false);
  
  // Update the selected pay period when financial year changes
  useEffect(() => {
    // Select the first period of the new financial year by default
    if (selectedFinancialYear.periods.length > 0) {
      setSelectedPayPeriod(selectedFinancialYear.periods[0]);
    }
  }, [selectedFinancialYear]);

  // Handle financial year change
  const handleFinancialYearChange = (yearDescription: string) => {
    const year = AVAILABLE_FINANCIAL_YEARS.find(y => y.description === yearDescription);
    if (year) {
      setSelectedFinancialYear(year);
    }
  };

  // Handle pay period change
  const handlePayPeriodChange = (periodNumber: string) => {
    const period = selectedFinancialYear.periods.find(p => p.periodNumber === parseInt(periodNumber));
    if (period) {
      setSelectedPayPeriod(period);
    }
  };

  const handleWizardReset = () => {
    setShowWizard(false);
    setTimeout(() => setShowWizard(true), 100);
  };

  return (
    <PageContainer title="Payroll Processing">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">UK Payroll Processing</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Financial Year:</span>
              <Select 
                value={selectedFinancialYear.description} 
                onValueChange={handleFinancialYearChange}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FINANCIAL_YEARS.map((year) => (
                    <SelectItem key={year.description} value={year.description}>
                      {year.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pay Period:</span>
              <Select 
                value={selectedPayPeriod.periodNumber.toString()} 
                onValueChange={handlePayPeriodChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {selectedFinancialYear.periods.map((period) => (
                    <SelectItem key={period.periodNumber} value={period.periodNumber.toString()}>
                      {period.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Import payroll data from Excel or CSV files to process multiple employees at once.
                  </p>
                  <Button onClick={() => setShowWizard(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Payroll Data
                  </Button>
                </div>
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
        
        <PayrollErrorBoundary onReset={handleWizardReset}>
          <PayrollInputWizard 
            open={showWizard} 
            onOpenChange={setShowWizard} 
          />
        </PayrollErrorBoundary>
      </div>
    </PageContainer>
  );
};

export default PayrollProcessing;
