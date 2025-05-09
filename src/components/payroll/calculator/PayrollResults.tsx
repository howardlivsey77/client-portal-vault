
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollResult } from "@/services/payroll/types";
import { Badge } from "@/components/ui/badge";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
  // Map student loan plan numbers to descriptive text
  const getStudentLoanPlanName = (plan: number | null) => {
    if (!plan) return "None";
    const planMap: Record<number, string> = {
      1: "Plan 1",
      2: "Plan 2",
      4: "Plan 4",
      5: "Plan 5"
    };
    return planMap[plan] || `Plan ${plan}`;
  };
  
  // Check if the tax code has specific indicators
  const isEmergencyTaxCode = result.taxCode?.includes('M1');
  const isScottishTaxCode = result.taxCode?.startsWith('S');
  const isBRTaxCode = result.taxCode === 'BR';
  const isNTTaxCode = result.taxCode === 'NT';

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Payroll Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>Employee:</div>
          <div className="font-medium">{result.employeeName}</div>
          {result.payrollId && (
            <>
              <div>Payroll ID:</div>
              <div className="font-medium">{result.payrollId}</div>
            </>
          )}
          <div>Pay Period:</div>
          <div className="font-medium">{payPeriod}</div>
          <div>Tax Year:</div>
          <div className="font-medium">{result.taxYear}</div>
          <div>Gross Pay:</div>
          <div className="font-medium">{formatCurrency(result.grossPay)}</div>
          <div>Net Pay:</div>
          <div className="font-medium text-green-600">{formatCurrency(result.netPay)}</div>
          <div>Tax Code:</div>
          <div className="font-medium flex items-center gap-2">
            {result.taxCode}
            {isEmergencyTaxCode && <Badge variant="destructive">Emergency</Badge>}
            {isScottishTaxCode && <Badge>Scottish</Badge>}
          </div>
          {result.taxRegion && result.taxRegion !== 'UK' && (
            <>
              <div>Tax Region:</div>
              <div className="font-medium">{result.taxRegion}</div>
            </>
          )}
          {result.studentLoanPlan && (
            <>
              <div>Student Loan Plan:</div>
              <div className="font-medium">{getStudentLoanPlanName(result.studentLoanPlan)}</div>
            </>
          )}
          {result.pensionPercentage > 0 && (
            <>
              <div>Pension Contribution:</div>
              <div className="font-medium">{result.pensionPercentage}%</div>
            </>
          )}
        </div>
      </div>
      
      {/* Gross Pay Build-Up Section */}
      <div className="bg-muted p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Gross Pay Build-Up</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Monthly Salary</TableCell>
              <TableCell className="text-right">{formatCurrency(result.monthlySalary)}</TableCell>
            </TableRow>
            {result.additionalEarnings && result.additionalEarnings.length > 0 && result.additionalEarnings.map((earning, index) => (
              <TableRow key={`earning-${index}`}>
                <TableCell>{earning.name}</TableCell>
                <TableCell className="text-right text-green-500">+{formatCurrency(earning.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t">
              <TableCell className="font-medium">Gross Pay</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(result.grossPay)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Deductions Section */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deductions</TableHead>
            <TableHead className="text-right">This Period</TableHead>
            <TableHead className="text-right">Year To Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              Income Tax
              <div className="text-xs text-muted-foreground mt-1">
                {isEmergencyTaxCode && "Emergency tax code applied"}
                {isScottishTaxCode && "Scottish tax rates applied"}
                {isBRTaxCode && "Basic rate applied to all income"}
                {isNTTaxCode && "No tax deducted"}
              </div>
            </TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.incomeTax)}</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.incomeTaxYTD || result.incomeTax)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>National Insurance</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.nationalInsurance)}</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.nationalInsuranceYTD || result.nationalInsurance)}</TableCell>
          </TableRow>
          {result.studentLoan > 0 && (
            <TableRow>
              <TableCell>Student Loan ({getStudentLoanPlanName(result.studentLoanPlan)})</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.studentLoan)}</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.studentLoan)}</TableCell>
            </TableRow>
          )}
          {result.pensionContribution > 0 && (
            <TableRow>
              <TableCell>Pension Contribution ({result.pensionPercentage}%)</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.pensionContribution)}</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.pensionContribution)}</TableCell>
            </TableRow>
          )}
          {result.additionalDeductions && result.additionalDeductions.length > 0 && result.additionalDeductions.map((deduction, index) => (
            <TableRow key={`deduction-${index}`}>
              <TableCell>{deduction.name}</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(deduction.amount)}</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(deduction.amount)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t">
            <TableCell className="font-medium">Total Deductions</TableCell>
            <TableCell className="text-right font-medium text-red-500">-{formatCurrency(result.totalDeductions)}</TableCell>
            <TableCell className="text-right font-medium text-red-500">-{formatCurrency(result.totalDeductions)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      {/* Allowances Section - Only show if there are allowances */}
      {result.additionalAllowances && result.additionalAllowances.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allowances</TableHead>
              <TableHead className="text-right">This Period</TableHead>
              <TableHead className="text-right">Year To Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.additionalAllowances.map((allowance, index) => (
              <TableRow key={`allowance-${index}`}>
                <TableCell>{allowance.name}</TableCell>
                <TableCell className="text-right text-green-500">+{formatCurrency(allowance.amount)}</TableCell>
                <TableCell className="text-right text-green-500">+{formatCurrency(allowance.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t">
              <TableCell className="font-medium">Total Allowances</TableCell>
              <TableCell className="text-right font-medium text-green-500">+{formatCurrency(result.totalAllowances)}</TableCell>
              <TableCell className="text-right font-medium text-green-500">+{formatCurrency(result.totalAllowances)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
      
      {/* Net Pay Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">This Period Net Pay</span>
            <span className="font-bold text-lg text-green-600">{formatCurrency(result.netPay)}</span>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">YTD Gross Pay</span>
              <span className="font-medium">{formatCurrency(result.grossPayYTD || result.grossPay)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">YTD Deductions</span>
              <span className="font-medium text-red-500">-{formatCurrency((result.incomeTaxYTD || result.incomeTax) + (result.nationalInsuranceYTD || result.nationalInsurance))}</span>
            </div>
            <div className="border-t mt-1 pt-1 flex justify-between items-center">
              <span className="font-bold">YTD Net Pay</span>
              <span className="font-bold text-green-600">{formatCurrency(result.netPay)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* UK Tax Year Information */}
      <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-md mt-4">
        <h3 className="text-md font-medium mb-1">UK Tax Year Information</h3>
        <div className="text-sm text-muted-foreground">
          <p>Tax Year: {result.taxYear} (6 Apr to 5 Apr)</p>
          <p>Tax Period: {result.taxPeriod} of 12</p>
          {result.taxCode.includes('M1') && (
            <p className="text-amber-600 mt-1">
              Emergency tax basis (Month 1) is being applied. Each period is calculated in isolation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
