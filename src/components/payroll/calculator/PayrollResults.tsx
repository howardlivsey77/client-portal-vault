
import { PayrollResult } from "@/services/payroll/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { Separator } from "@/components/ui/separator";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
  onClearResults?: () => void;
}

export function PayrollResults({ result, payPeriod, onClearResults }: PayrollResultsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payroll Results - {payPeriod}</CardTitle>
          {onClearResults && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearResults}
            >
              Clear Results
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Earnings Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Earnings</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Gross Pay:</span>
                  <span className="font-medium">{formatCurrency(result.grossPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Pay:</span>
                  <span>{formatCurrency(result.taxablePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Free Pay:</span>
                  <span>{formatCurrency(result.freePay)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Deductions</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Income Tax:</span>
                  <span className="text-red-600">{formatCurrency(result.incomeTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>National Insurance:</span>
                  <span className="text-red-600">{formatCurrency(result.nationalInsurance)}</span>
                </div>
                {result.studentLoan > 0 && (
                  <div className="flex justify-between">
                    <span>Student Loan:</span>
                    <span className="text-red-600">{formatCurrency(result.studentLoan)}</span>
                  </div>
                )}
                {result.pensionContribution > 0 && (
                  <div className="flex justify-between">
                    <span>Pension:</span>
                    <span className="text-red-600">{formatCurrency(result.pensionContribution)}</span>
                  </div>
                )}
                {result.nhsPensionEmployeeContribution > 0 && (
                  <div className="flex justify-between">
                    <span>NHS Pension:</span>
                    <span className="text-red-600">{formatCurrency(result.nhsPensionEmployeeContribution)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Deductions:</span>
                  <span className="text-red-600">{formatCurrency(result.totalDeductions)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Allowances:</span>
                  <span className="text-green-600">{formatCurrency(result.totalAllowances)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Pay:</span>
                  <span className="text-green-600">{formatCurrency(result.netPay)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NHS Pension Details */}
          {result.isNHSPensionMember && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-lg mb-3">NHS Pension Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Contribution Tier:</span>
                    <span className="font-medium">Tier {result.nhsPensionTier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employee Rate:</span>
                    <span>{result.nhsPensionEmployeeRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employee Contribution:</span>
                    <span className="text-red-600">{formatCurrency(result.nhsPensionEmployeeContribution)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Employer Rate:</span>
                    <span>{result.nhsPensionEmployerRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employer Contribution:</span>
                    <span className="text-blue-600">{formatCurrency(result.nhsPensionEmployerContribution)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          {(result.additionalEarnings.length > 0 || result.additionalDeductions.length > 0 || result.additionalAllowances.length > 0) && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-lg mb-3">Additional Items</h3>
              
              {result.additionalEarnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Additional Earnings</h4>
                  {result.additionalEarnings.map((earning, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{earning.description}:</span>
                      <span className="text-green-600">{formatCurrency(earning.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {result.additionalDeductions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Additional Deductions</h4>
                  {result.additionalDeductions.map((deduction, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{deduction.description}:</span>
                      <span className="text-red-600">{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {result.additionalAllowances.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Additional Allowances</h4>
                  {result.additionalAllowances.map((allowance, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{allowance.description}:</span>
                      <span className="text-green-600">{formatCurrency(allowance.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
