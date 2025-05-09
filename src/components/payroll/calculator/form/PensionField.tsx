
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

interface PensionFieldProps {
  pensionPercentage: number;
  onNumberInputChange: (field: string, value: string) => void;
}

export function PensionField({ pensionPercentage, onNumberInputChange }: PensionFieldProps) {
  return (
    <div>
      <Label htmlFor="pensionPercentage" className="flex items-center">
        Pension Contribution %
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                <HelpCircle className="h-3 w-3" />
                <span className="sr-only">Pension contribution percentage</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>The percentage of salary contributed to a pension scheme.</p>
              <p>Pension contributions are deducted from gross pay before tax.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      <Input
        id="pensionPercentage"
        type="number"
        min="0"
        max="100"
        value={pensionPercentage}
        onChange={(e) => onNumberInputChange('pensionPercentage', e.target.value)}
      />
    </div>
  );
}
