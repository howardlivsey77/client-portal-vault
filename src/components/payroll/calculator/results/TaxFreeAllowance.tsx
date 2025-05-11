
import { formatCurrency } from "@/lib/formatters";
import { PayrollResult } from "@/services/payroll/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface TaxFreeAllowanceProps {
  taxCode: string;
  freePay: number;
  result?: PayrollResult;
}

export function TaxFreeAllowance({ taxCode, freePay, result }: TaxFreeAllowanceProps) {
  const [showFreePayDetails, setShowFreePayDetails] = useState(false);
  
  // Use result if provided, otherwise fallback to individual props
  const taxablePay = result?.taxablePay || 0;
  const grossPay = result?.grossPay || 0;
  
  return (
    <div className="bg-muted p-4 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Tax-Free Allowance</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Free Pay is calculated based on your tax code and represents your monthly tax-free allowance.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>Tax Code:</div>
        <div className="font-medium">{taxCode}</div>
        <div>Monthly Free Pay:</div>
        <div className="font-medium text-green-600">{formatCurrency(freePay)}</div>
        <div>Taxable Pay:</div>
        <div className="font-medium">{formatCurrency(taxablePay)}</div>
      </div>
      
      <Collapsible 
        open={showFreePayDetails} 
        onOpenChange={setShowFreePayDetails} 
        className="mt-2"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="flex w-full justify-between p-2 text-sm">
            <span>{showFreePayDetails ? "Hide calculation details" : "Show calculation details"}</span>
            {showFreePayDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="bg-slate-50 dark:bg-slate-900 p-2 rounded mt-2">
          <p className="text-sm text-muted-foreground mb-2">
            The free pay amount is calculated based on the numeric part of your tax code.
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Taxable Pay = Gross Pay - Free Pay = {formatCurrency(grossPay)} - {formatCurrency(freePay)} = {formatCurrency(taxablePay)}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
