
import { Button } from "@/components/ui/button";
import { PayrollFormValues } from "./types";
import { PayrollResult } from "@/services/payroll/types";
import { PayslipDownloader } from "./PayslipDownloader";

interface PayrollCalculatorActionsProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  isCalculating: boolean;
  isSaving: boolean;
  payrollDetails: PayrollFormValues;
  calculationResult: PayrollResult | null;
  onCalculate: () => void;
  payPeriodDescription: string;
}

export function PayrollCalculatorActions({
  selectedTab,
  setSelectedTab,
  isCalculating,
  isSaving,
  payrollDetails,
  calculationResult,
  onCalculate,
  payPeriodDescription
}: PayrollCalculatorActionsProps) {
  return (
    <div className="flex justify-between">
      {selectedTab === "calculator" ? (
        <Button 
          onClick={onCalculate} 
          disabled={isCalculating || isSaving || !payrollDetails.monthlySalary || !payrollDetails.employeeName}
        >
          {isCalculating ? "Calculating..." : isSaving ? "Saving..." : "Calculate Payroll"}
        </Button>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setSelectedTab("calculator")}
        >
          Back to Calculator
        </Button>
      )}
      
      {calculationResult && selectedTab === "result" && (
        <PayslipDownloader 
          calculationResult={calculationResult}
          payPeriodDescription={payPeriodDescription}
        />
      )}
    </div>
  );
}
