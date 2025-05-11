
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollSummary } from "./PayrollSummary";
import { 
  GrossPayBreakdown, 
  DeductionsBreakdown, 
  AllowancesBreakdown, 
  NetPaySummary,
  NationalInsuranceBands 
} from "./PayrollBreakdown";
import { TaxFreeAllowance } from "./TaxFreeAllowance";
import { PayrollResult } from "@/services/payroll/types";

interface PayrollResultsContainerProps {
  result: PayrollResult;
  payPeriod: string;
  onClearResults?: () => Promise<void>;
}

export function PayrollResultsContainer({ 
  result, 
  payPeriod, 
  onClearResults 
}: PayrollResultsContainerProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Results for {result.employeeName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PayrollSummary result={result} payPeriod={payPeriod} />
            <TaxFreeAllowance taxCode={result.taxCode} freePay={result.freePay} />
          </div>

          <div className="mt-10 space-y-8">
            <GrossPayBreakdown result={result} />

            <div>
              <h3 className="text-lg font-medium mb-4">Deductions and Allowances</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <DeductionsBreakdown result={result} />
                  <NationalInsuranceBands result={result} />
                </div>
                
                <div>
                  <AllowancesBreakdown result={result} />
                </div>
              </div>
            </div>

            <NetPaySummary result={result} />
          </div>
        </CardContent>
        
        {onClearResults && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onClearResults}>
              Clear Results
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
