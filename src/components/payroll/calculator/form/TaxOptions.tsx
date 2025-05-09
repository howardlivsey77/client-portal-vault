
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface TaxOptionsProps {
  useEmergencyTax: boolean;
  isNewEmployee: boolean;
  onInputChange: (field: string, value: any) => void;
}

export function TaxOptions({ useEmergencyTax, isNewEmployee, onInputChange }: TaxOptionsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="useEmergencyTax" 
          checked={useEmergencyTax}
          onCheckedChange={(checked) => 
            onInputChange('useEmergencyTax', checked === true)
          }
        />
        <Label htmlFor="useEmergencyTax" className="flex items-center">
          Use Emergency Tax Basis (Week 1/Month 1)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                  <HelpCircle className="h-3 w-3" />
                  <span className="sr-only">Emergency tax information</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="w-80">
                <p>Emergency tax basis treats each pay period separately, without considering previous periods.</p>
                <p>Use for new employees when you don't have their P45 or tax code.</p>
                <p>When checked, YTD calculations won't include previous periods.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="isNewEmployee" 
          checked={isNewEmployee}
          onCheckedChange={(checked) => 
            onInputChange('isNewEmployee', checked === true)
          }
        />
        <Label htmlFor="isNewEmployee">
          First payment in tax year
        </Label>
      </div>
    </div>
  );
}
