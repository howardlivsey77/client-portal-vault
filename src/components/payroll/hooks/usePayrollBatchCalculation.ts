import { useState, useCallback } from 'react';
import { useToast } from '@/hooks';
import { useCompany } from '@/providers/CompanyProvider';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { PayrollAdjustments } from '../adjustments/types';
import { calculateMonthlyPayroll } from '@/services/payroll/payrollCalculator';
import { savePayrollResultToDatabase } from '@/services/payroll/database/payrollDatabaseService';
import { DepartmentGroup } from './usePayrollTableData';

interface BatchCalculationProgress {
  current: number;
  total: number;
  currentEmployee: string;
}

export function usePayrollBatchCalculation(
  payPeriod: PayPeriod,
  adjustmentsMap: Record<string, PayrollAdjustments>,
  groupedData: DepartmentGroup[],
  onComplete: () => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchCalculationProgress | null>(null);
  const { currentCompany } = useCompany();
  const { toast } = useToast();

  const calculateAndSaveAll = useCallback(async () => {
    if (!currentCompany?.id) {
      toast({
        title: 'No company selected',
        description: 'Please select a company before processing payroll.',
        variant: 'destructive',
      });
      return;
    }

    // Get all employees from grouped data
    const allEmployees = groupedData.flatMap(group => group.rows);
    
    if (allEmployees.length === 0) {
      toast({
        title: 'No employees',
        description: 'There are no employees to process.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: allEmployees.length, currentEmployee: '' });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < allEmployees.length; i++) {
        const employee = allEmployees[i];
        const adjustments = adjustmentsMap[employee.employeeId];
        
        setProgress({
          current: i + 1,
          total: allEmployees.length,
          currentEmployee: employee.name,
        });

        try {
          // Build additional earnings from adjustments
          const additionalEarnings: Array<{ description: string; amount: number }> = [];
          
          if (adjustments) {
            // Add overtime items
            adjustments.overtime.forEach(item => {
              additionalEarnings.push({
                description: `Overtime (${item.hours}h @ ${item.rateMultiplier}x)`,
                amount: item.amount,
              });
            });
            
            // Add statutory payments
            adjustments.statutoryPayment.forEach(item => {
              additionalEarnings.push({
                description: item.type,
                amount: item.amount,
              });
            });
            
            // Add sickness/SSP
            adjustments.sickness.forEach(item => {
              additionalEarnings.push({
                description: `SSP (${item.daysQualifying} days)`,
                amount: item.amount,
              });
            });
            
            // Add extra payments
            adjustments.extraPayments.forEach(item => {
              additionalEarnings.push({
                description: item.description || 'Extra Payment',
                amount: item.amount,
              });
            });
          }

          // Build additional deductions
          const additionalDeductions: Array<{ description: string; amount: number }> = [];
          if (adjustments) {
            adjustments.extraDeductions.forEach(item => {
              additionalDeductions.push({
                description: item.description || 'Extra Deduction',
                amount: item.amount,
              });
            });
          }

          // Calculate payroll with adjustments using actual employee data
          const result = await calculateMonthlyPayroll({
            employeeId: employee.employeeId,
            employeeName: employee.name,
            payrollId: employee.payrollId,
            monthlySalary: employee.salary,
            taxCode: employee.taxCode,
            additionalEarnings,
            additionalDeductions,
            pensionPercentage: employee.pensionPercentage,
            studentLoanPlan: employee.studentLoanPlan,
            isNHSPensionMember: employee.isNHSPensionMember,
            previousYearPensionablePay: employee.previousYearPensionablePay,
          });

          // Save to database
          const saveResult = await savePayrollResultToDatabase(result, payPeriod, currentCompany.id);
          
          if (saveResult.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`${employee.name}: ${saveResult.error}`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`${employee.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Show completion toast
      if (errorCount === 0) {
        toast({
          title: 'Payroll calculated and saved',
          description: `Successfully processed ${successCount} employee(s).`,
        });
      } else {
        toast({
          title: 'Payroll processing completed with errors',
          description: `${successCount} succeeded, ${errorCount} failed.`,
          variant: 'destructive',
        });
        console.error('Payroll errors:', errors);
      }

      // Trigger refetch
      onComplete();
    } catch (error) {
      toast({
        title: 'Error processing payroll',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [currentCompany?.id, groupedData, adjustmentsMap, payPeriod, toast, onComplete]);

  const hasAdjustments = Object.keys(adjustmentsMap).length > 0;

  return {
    calculateAndSaveAll,
    isProcessing,
    progress,
    hasAdjustments,
  };
}
