
import React from 'react';
import { Button } from "@/components/ui/button";

interface PayrollFormSubmitProps {
  onCalculate?: () => void;
  isCalculating?: boolean;
}

export function PayrollFormSubmit({ onCalculate, isCalculating }: PayrollFormSubmitProps) {
  if (!onCalculate) return null;
  
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={isCalculating}>
        {isCalculating ? "Calculating..." : "Calculate Payroll"}
      </Button>
    </div>
  );
}
