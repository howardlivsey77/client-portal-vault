
import { PayrollResult } from "@/services/payroll/types";
import { parseTaxCode } from "@/services/payroll/utils/tax-code-utils";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaxCalculationDebugProps {
  result: PayrollResult;
}

export function TaxCalculationDebug({ result }: TaxCalculationDebugProps) {
  const { 
    taxCode, 
    grossPay, 
    taxablePay, 
    pensionContribution, 
    incomeTax,
    taxPeriod 
  } = result;
  
  const { allowance, monthlyAllowance } = parseTaxCode(taxCode);
  const isEmergencyTax = taxCode.includes('M1');
  
  // Calculate expected tax
  const effectiveMonthlyAllowance = isEmergencyTax 
    ? monthlyAllowance 
    : (allowance / 12) * taxPeriod;
  
  const actualTaxableAmount = Math.max(0, taxablePay - effectiveMonthlyAllowance);
  const basicRateTax = actualTaxableAmount * 0.2; // 20% tax rate
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Tax Calculation Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-2">
          <div className="grid grid-cols-2">
            <span>Gross Pay:</span>
            <span className="text-right">{formatCurrency(grossPay)}</span>
          </div>
          <div className="grid grid-cols-2">
            <span>Pension Contribution ({result.pensionPercentage}%):</span>
            <span className="text-right">-{formatCurrency(pensionContribution)}</span>
          </div>
          <div className="grid grid-cols-2 font-medium">
            <span>Taxable Pay:</span>
            <span className="text-right">{formatCurrency(taxablePay)}</span>
          </div>
          <div className="grid grid-cols-2">
            <span>Tax-Free Allowance (from {taxCode}):</span>
            <span className="text-right">-{formatCurrency(effectiveMonthlyAllowance)}</span>
          </div>
          <div className="grid grid-cols-2 font-medium">
            <span>Pay Subject to Tax:</span>
            <span className="text-right">{formatCurrency(actualTaxableAmount)}</span>
          </div>
          <div className="grid grid-cols-2">
            <span>Basic Rate Tax (20%):</span>
            <span className="text-right">{formatCurrency(incomeTax)}</span>
          </div>
          <div className="grid grid-cols-2 text-xs text-muted-foreground mt-2">
            <span>Tax Code Type:</span>
            <span className="text-right">
              {isEmergencyTax ? "Emergency (Week 1/Month 1)" : "Cumulative"}
            </span>
          </div>
          <div className="grid grid-cols-2 text-xs text-muted-foreground">
            <span>Tax Period:</span>
            <span className="text-right">{taxPeriod} of 12</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
