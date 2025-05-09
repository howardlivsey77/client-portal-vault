
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface TaxCodeFieldProps {
  taxCode: string;
  onInputChange: (field: string, value: any) => void;
}

export function TaxCodeField({ taxCode, onInputChange }: TaxCodeFieldProps) {
  return (
    <div>
      <Label htmlFor="taxCode" className="flex items-center">
        Tax Code
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                <HelpCircle className="h-3 w-3" />
                <span className="sr-only">UK tax code</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>The UK tax code determines the employee&apos;s tax-free allowance.</p>
              <p>Common codes: 1257L (standard), BR (basic rate), K prefix (reduced allowance)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      <div className="flex space-x-2">
        <Input
          id="taxCode"
          value={taxCode}
          onChange={(e) => onInputChange('taxCode', e.target.value.toUpperCase())}
          placeholder="e.g., 1257L"
          className="flex-grow"
        />
      </div>
    </div>
  );
}
