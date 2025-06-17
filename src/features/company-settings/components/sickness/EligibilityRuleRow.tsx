
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash } from "lucide-react";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";

interface EligibilityRuleRowProps {
  rule: EligibilityRule;
  onRuleChange: (id: string, field: keyof EligibilityRule, value: any) => void;
  onRemoveRule: (id: string) => void;
}

export function EligibilityRuleRow({ rule, onRuleChange, onRemoveRule }: EligibilityRuleRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Input 
          type="number"
          min="0"
          value={rule.serviceMonthsFrom}
          onChange={(e) => onRuleChange(
            rule.id, 
            'serviceMonthsFrom', 
            parseInt(e.target.value) || 0
          )}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Input 
          type="number"
          min="0"
          value={rule.serviceMonthsTo}
          onChange={(e) => onRuleChange(
            rule.id, 
            'serviceMonthsTo', 
            parseInt(e.target.value) || 0
          )}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Input 
          type="number"
          min="0"
          value={rule.fullPayDays}
          onChange={(e) => onRuleChange(
            rule.id, 
            'fullPayDays', 
            parseInt(e.target.value) || 0
          )}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Input 
          type="number"
          min="0"
          value={rule.halfPayDays}
          onChange={(e) => onRuleChange(
            rule.id, 
            'halfPayDays', 
            parseInt(e.target.value) || 0
          )}
          className="w-full"
        />
      </TableCell>
      <TableCell>
        <Select 
          value={rule.sicknessPay} 
          onValueChange={(value) => onRuleChange(rule.id, 'sicknessPay', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SSP">SSP Only</SelectItem>
            <SelectItem value="NoSSP">No Pay</SelectItem>
            <SelectItem value="FullPay">Full Pay</SelectItem>
            <SelectItem value="HalfPay">Half Pay</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onRemoveRule(rule.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
