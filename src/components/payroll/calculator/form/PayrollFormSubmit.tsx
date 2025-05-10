
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PayrollFormSubmitProps {
  onCalculate?: () => void;
  isCalculating?: boolean;
}

export function PayrollFormSubmit({ onCalculate, isCalculating }: PayrollFormSubmitProps) {
  if (!onCalculate) return null;
  
  return (
    <div className="flex justify-end">
      <Button 
        type="submit" 
        disabled={isCalculating}
        className="min-w-[180px]"
      >
        {isCalculating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculating...
          </span>
        ) : (
          "Calculate Payroll"
        )}
      </Button>
    </div>
  );
}
