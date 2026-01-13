import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { generatePayslip } from '@/utils';
import { PayrollResult } from '@/services/payroll/types';
import { useToast } from '@/hooks';

interface PayslipPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  payrollId: string;
  payPeriod: string;
  // Earnings
  basicSalary: number;
  overtime: number;
  statutoryPayment: number;
  ssp: number;
  extraPayments: Array<{ description: string; amount: number }>;
  // Deductions
  incomeTax: number;
  nationalInsurance: number;
  pension: number;
  studentLoan: number;
  extraDeductions: Array<{ description: string; amount: number }>;
  // Totals
  grossPay: number;
  netPay: number;
  // Sickness info
  fullPaySickDays?: number;
}

export function PayslipPreviewDialog({
  open,
  onOpenChange,
  employeeName,
  payrollId,
  payPeriod,
  basicSalary,
  overtime,
  statutoryPayment,
  ssp,
  extraPayments,
  incomeTax,
  nationalInsurance,
  pension,
  studentLoan,
  extraDeductions,
  grossPay,
  netPay,
  fullPaySickDays = 0,
}: PayslipPreviewDialogProps) {
  const { toast } = useToast();

  // Build sickness note
  const sicknessNote = fullPaySickDays > 0
    ? `${fullPaySickDays} full paid sickness day${fullPaySickDays !== 1 ? 's' : ''} included in the salary`
    : '';

  // Build earnings rows
  const earningsRows: Array<{ description: string; amount: number; note?: string }> = [
    { description: 'Basic Salary', amount: basicSalary, note: sicknessNote },
  ];
  if (overtime > 0) earningsRows.push({ description: 'Overtime', amount: overtime });
  if (statutoryPayment > 0) earningsRows.push({ description: 'Statutory Payment', amount: statutoryPayment });
  if (ssp > 0) earningsRows.push({ description: 'SSP', amount: ssp });
  extraPayments.forEach(item => {
    if (item.amount > 0) earningsRows.push(item);
  });

  // Build deductions rows
  const deductionsRows: Array<{ description: string; amount: number }> = [];
  if (incomeTax > 0) deductionsRows.push({ description: 'Income Tax', amount: incomeTax });
  if (nationalInsurance > 0) deductionsRows.push({ description: 'National Insurance', amount: nationalInsurance });
  if (pension > 0) deductionsRows.push({ description: 'Pension', amount: pension });
  if (studentLoan > 0) deductionsRows.push({ description: 'Student Loan', amount: studentLoan });
  extraDeductions.forEach(item => {
    if (item.amount > 0) deductionsRows.push(item);
  });

  const totalDeductions = deductionsRows.reduce((sum, row) => sum + row.amount, 0);

  const handleDownloadPDF = () => {
    try {
      // Create a PayrollResult object for the PDF generator
      const payrollData: PayrollResult = {
        employeeId: '',
        employeeName,
        payrollId,
        monthlySalary: basicSalary,
        grossPay,
        taxablePay: grossPay,
        incomeTax,
        nationalInsurance,
        employerNationalInsurance: 0,
        studentLoan,
        pensionContribution: pension,
        additionalDeductions: extraDeductions,
        additionalAllowances: [],
        additionalEarnings: [
          ...(overtime > 0 ? [{ description: 'Overtime', amount: overtime }] : []),
          ...(statutoryPayment > 0 ? [{ description: 'Statutory Payment', amount: statutoryPayment }] : []),
          ...(ssp > 0 ? [{ description: 'SSP', amount: ssp }] : []),
          ...extraPayments,
        ],
        sicknessNote,
        totalDeductions,
        totalAllowances: 0,
        netPay,
        freePay: 0,
        taxCode: '',
        earningsAtLEL: 0,
        earningsLELtoPT: 0,
        earningsPTtoUEL: 0,
        earningsAboveUEL: 0,
        earningsAboveST: 0,
        nhsPensionEmployeeContribution: 0,
        nhsPensionEmployerContribution: 0,
        nhsPensionTier: 0,
        nhsPensionEmployeeRate: 0,
        nhsPensionEmployerRate: 0,
        isNHSPensionMember: false,
      };

      const filename = `${employeeName.replace(/\s+/g, '-').toLowerCase()}-payslip-${payPeriod.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      generatePayslip(payrollData, payPeriod, filename);

      toast({
        title: 'Payslip Downloaded',
        description: 'The payslip PDF has been downloaded.',
      });
    } catch (error) {
      console.error('Error generating payslip:', error);
      toast({
        title: 'Download Error',
        description: 'There was an error generating the payslip PDF.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl font-bold">COMPANY NAME</DialogTitle>
          <p className="text-sm text-muted-foreground">Payslip</p>
        </DialogHeader>

        {/* Employee Details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm border-b pb-3">
          <div>
            <span className="text-muted-foreground">Employee:</span>{' '}
            <span className="font-medium">{employeeName}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Date:</span>{' '}
            <span className="font-medium">{formatDate(new Date())}</span>
          </div>
          {payrollId && (
            <div>
              <span className="text-muted-foreground">Payroll ID:</span>{' '}
              <span className="font-medium">{payrollId}</span>
            </div>
          )}
          <div className="text-right">
            <span className="text-muted-foreground">Gross:</span>{' '}
            <span className="font-medium">{formatCurrency(grossPay)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pay Period:</span>{' '}
            <span className="font-medium">{payPeriod}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Net:</span>{' '}
            <span className="font-medium text-primary">{formatCurrency(netPay)}</span>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Earnings</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {earningsRows.map((row, idx) => (
                  <>
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                      <td className="px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.amount)}</td>
                    </tr>
                    {row.note && (
                      <tr key={`${idx}-note`} className="bg-muted/10">
                        <td colSpan={2} className="px-3 py-1 text-xs text-muted-foreground italic">
                          ({row.note})
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deductions Section */}
        {deductionsRows.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Deductions</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Description</th>
                    <th className="text-right px-3 py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionsRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                      <td className="px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="px-3 py-2 font-medium">Gross Pay</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(grossPay)}</td>
              </tr>
              <tr className="bg-muted/30">
                <td className="px-3 py-2 font-medium">Total Deductions</td>
                <td className="px-3 py-2 text-right tabular-nums text-destructive">-{formatCurrency(totalDeductions)}</td>
              </tr>
              <tr className="bg-primary/10">
                <td className="px-3 py-3 font-bold text-primary">Net Pay</td>
                <td className="px-3 py-3 text-right tabular-nums font-bold text-primary text-lg">{formatCurrency(netPay)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This payslip is a preview. Download the PDF for official records.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
