
import { PayrollResult } from "@/services/payroll/types";
import { PayrollSummary } from "./PayrollSummary";
import { TaxFreeAllowance } from "./TaxFreeAllowance";
import { GrossPayBreakdown, DeductionsBreakdown, AllowancesBreakdown, NetPaySummary } from "./PayrollBreakdown";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PayrollResultsContainerProps {
  result: PayrollResult;
  payPeriod: string;
  onClearResults?: () => Promise<void>;
}

export function PayrollResultsContainer({ result, payPeriod, onClearResults }: PayrollResultsContainerProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const handleClearResults = async () => {
    if (!onClearResults) return;
    
    try {
      setIsClearing(true);
      setClearError(null);
      await onClearResults();
    } catch (error) {
      console.error("Error clearing results:", error);
      setClearError("Failed to clear payroll results. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payroll Results</h3>
        {onClearResults && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearResults}
            disabled={isClearing}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            {isClearing ? "Clearing..." : "Clear All Results"}
            {!isClearing && <Trash2 className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>

      {clearError && (
        <Alert variant="destructive">
          <AlertDescription>{clearError}</AlertDescription>
        </Alert>
      )}

      <PayrollSummary result={result} payPeriod={payPeriod} />
      <TaxFreeAllowance result={result} />
      <GrossPayBreakdown result={result} />
      <DeductionsBreakdown result={result} />
      <AllowancesBreakdown result={result} />
      <NetPaySummary result={result} />
    </div>
  );
}
