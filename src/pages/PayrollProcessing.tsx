
import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { 
  PayrollTableView, 
  PayrollInputWizard, 
  PayrollErrorBoundary 
} from "@/components/payroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, AlertTriangle, Settings, Building2 } from "lucide-react";
import { FpsGenerationPanel } from "@/components/hmrc/FpsGenerationPanel";
import { Link } from "react-router-dom";
import { 
  AVAILABLE_FINANCIAL_YEARS, 
  PayPeriod, 
  FinancialYear,
  CURRENT_FINANCIAL_YEAR,
  CURRENT_PAY_PERIOD
} from "@/services/payroll/utils/financial-year-utils";
import { useCompany } from "@/providers/CompanyProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PayrollProcessing = () => {
  const { currentCompany, isLoading: isCompanyLoading } = useCompany();
  
  // State for financial year and pay period
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<FinancialYear>(CURRENT_FINANCIAL_YEAR);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod>(CURRENT_PAY_PERIOD);
  const [showWizard, setShowWizard] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get company's payroll start settings
  const companyStartYear = currentCompany?.payroll_start_year;
  const companyStartPeriod = currentCompany?.payroll_start_period;
  
  // Check if current selection is before company's migration start
  const isBeforeMigrationStart = React.useMemo(() => {
    if (!companyStartYear || !companyStartPeriod) return false;
    
    if (selectedFinancialYear.year < companyStartYear) return true;
    if (selectedFinancialYear.year === companyStartYear && 
        selectedPayPeriod.periodNumber < companyStartPeriod) return true;
    
    return false;
  }, [selectedFinancialYear, selectedPayPeriod, companyStartYear, companyStartPeriod]);

  // Initialize with company defaults when company data loads
  useEffect(() => {
    if (isInitialized || isCompanyLoading) return;
    
    if (currentCompany) {
      // Use company's payroll start settings or fall back to current period
      const startYear = companyStartYear || CURRENT_FINANCIAL_YEAR.year;
      const startPeriod = companyStartPeriod || CURRENT_PAY_PERIOD.periodNumber;
      
      const year = AVAILABLE_FINANCIAL_YEARS.find(y => y.year === startYear);
      if (year) {
        setSelectedFinancialYear(year);
        const period = year.periods.find(p => p.periodNumber === startPeriod);
        if (period) {
          setSelectedPayPeriod(period);
        } else if (year.periods.length > 0) {
          setSelectedPayPeriod(year.periods[0]);
        }
      }
      setIsInitialized(true);
    }
  }, [currentCompany, isCompanyLoading, isInitialized, companyStartYear, companyStartPeriod]);

  // Handle financial year change
  const handleFinancialYearChange = (yearDescription: string) => {
    const year = AVAILABLE_FINANCIAL_YEARS.find(y => y.description === yearDescription);
    if (year) {
      setSelectedFinancialYear(year);
      
      // If changing to the company's start year, default to start period
      if (year.year === companyStartYear && companyStartPeriod) {
        const startPeriod = year.periods.find(p => p.periodNumber === companyStartPeriod);
        if (startPeriod) {
          setSelectedPayPeriod(startPeriod);
          return;
        }
      }
      
      // Otherwise select first period
      if (year.periods.length > 0) {
        setSelectedPayPeriod(year.periods[0]);
      }
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

  // Check if a period is before the migration start
  const isPeriodDisabled = (year: FinancialYear, periodNumber: number): boolean => {
    if (!companyStartYear || !companyStartPeriod) return false;
    
    if (year.year < companyStartYear) return true;
    if (year.year === companyStartYear && periodNumber < companyStartPeriod) return true;
    
    return false;
  };

  // Check if a year is entirely before migration start
  const isYearBeforeMigration = (year: FinancialYear): boolean => {
    if (!companyStartYear) return false;
    return year.year < companyStartYear;
  };

  // Check if company has payroll settings configured
  const hasPayrollSettings = companyStartYear && companyStartPeriod;

  return (
    <PageContainer title="Payroll Processing">
      <div className="w-full">
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
                    <SelectItem 
                      key={year.description} 
                      value={year.description}
                      className={isYearBeforeMigration(year) ? "text-muted-foreground" : ""}
                    >
                      {year.description}
                      {isYearBeforeMigration(year) && " ⚠️"}
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
                  {selectedFinancialYear.periods.map((period) => {
                    const disabled = isPeriodDisabled(selectedFinancialYear, period.periodNumber);
                    return (
                      <SelectItem 
                        key={period.periodNumber} 
                        value={period.periodNumber.toString()}
                        className={disabled ? "text-muted-foreground" : ""}
                      >
                        {period.description}
                        {disabled && " ⚠️"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Warning for periods before migration start */}
        {isBeforeMigrationStart && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This period is before your company's payroll migration start date 
              (Period {companyStartPeriod} of {AVAILABLE_FINANCIAL_YEARS.find(y => y.year === companyStartYear)?.description || companyStartYear}). 
              No payroll data exists for this period. Calculations may be inaccurate without YTD balances.
            </AlertDescription>
          </Alert>
        )}

        {/* Info banner for companies without payroll settings */}
        {!hasPayrollSettings && !isCompanyLoading && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Setup required:</strong> Configure your payroll start year and period in{" "}
              <Link to="/settings/company/general" className="underline font-medium">
                Company Settings
              </Link>{" "}
              to ensure accurate YTD calculations.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="calculator" className="mb-6">
          <TabsList>
            <TabsTrigger value="calculator">Employee Calculator</TabsTrigger>
            <TabsTrigger value="batch">Batch Processing</TabsTrigger>
            <TabsTrigger value="hmrc">
              <Building2 className="h-4 w-4 mr-1" />
              HMRC
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator">
            <Card>
              <CardHeader>
                <CardTitle>Employee Payroll Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <PayrollTableView payPeriod={selectedPayPeriod} />
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

          <TabsContent value="hmrc">
            <FpsGenerationPanel
              defaultTaxYear={`${selectedFinancialYear.year}/${(selectedFinancialYear.year + 1).toString().slice(-2)}`}
              defaultTaxPeriod={selectedPayPeriod.periodNumber}
            />
          </TabsContent>
        </Tabs>
        
        <PayrollErrorBoundary onReset={handleWizardReset}>
          <PayrollInputWizard 
            open={showWizard} 
            onOpenChange={setShowWizard}
            payPeriod={selectedPayPeriod}
            financialYear={selectedFinancialYear.year}
          />
        </PayrollErrorBoundary>
      </div>
    </PageContainer>
  );
};

export default PayrollProcessing;
