
import { PayrollResult } from "@/services/payroll/types";
import { PayrollSummary } from "./PayrollSummary";
import { GrossPayTable } from "./GrossPayTable";
import { DeductionsTable } from "./DeductionsTable";
import { AllowancesTable } from "./AllowancesTable";
import { PaySummary } from "./PaySummary";
import { TaxYearInfo } from "./TaxYearInfo";
import { TaxCalculationDebug } from "./TaxCalculationDebug";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug, PieChart } from "lucide-react";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
  const [showDebug, setShowDebug] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  
  return (
    <div className="space-y-4">
      <PayrollSummary result={result} payPeriod={payPeriod} />
      <GrossPayTable result={result} />
      <DeductionsTable result={result} />
      <AllowancesTable result={result} />
      <PaySummary result={result} />
      <TaxYearInfo result={result} />
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs"
        >
          <Bug className="h-3 w-3 mr-1" />
          {showDebug ? "Hide" : "Show"} Tax Calculation Details
        </Button>
      </div>
      
      {showDebug && <TaxCalculationDebug result={result} />}
    </div>
  );
}
