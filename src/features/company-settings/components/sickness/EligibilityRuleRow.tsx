
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash } from "lucide-react";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { TIME_UNIT_OPTIONS, PAY_UNIT_OPTIONS } from "./unitUtils";

interface EligibilityRuleRowProps {
  rule: EligibilityRule;
  onRuleChange: (id: string, field: keyof EligibilityRule, value: any) => void;
  onRemoveRule: (id: string) => void;
}

export function EligibilityRuleRow({ rule, onRuleChange, onRemoveRule }: EligibilityRuleRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex gap-1">
          <Input 
            type="number"
            min="0"
            value={rule.serviceFrom}
            onChange={(e) => onRuleChange(
              rule.id, 
              'serviceFrom', 
              parseInt(e.target.value) || 0
            )}
            className="w-16"
          />
          <Select 
            value={rule.serviceFromUnit} 
            onValueChange={(value) => onRuleChange(rule.id, 'serviceFromUnit', value)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_UNIT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Input 
            type="number"
            min="0"
            value={rule.serviceTo || ''}
            onChange={(e) => onRuleChange(
              rule.id, 
              'serviceTo', 
              e.target.value ? parseInt(e.target.value) : null
            )}
            className="w-16"
            placeholder="∞"
          />
          <Select 
            value={rule.serviceToUnit} 
            onValueChange={(value) => onRuleChange(rule.id, 'serviceToUnit', value)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_UNIT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Input 
            type="number"
            min="0"
            value={rule.fullPayAmount}
            onChange={(e) => onRuleChange(
              rule.id, 
              'fullPayAmount', 
              parseInt(e.target.value) || 0
            )}
            className="w-16"
          />
          <Select 
            value={rule.fullPayUnit} 
            onValueChange={(value) => onRuleChange(rule.id, 'fullPayUnit', value)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAY_UNIT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Input 
            type="number"
            min="0"
            value={rule.halfPayAmount}
            onChange={(e) => onRuleChange(
              rule.id, 
              'halfPayAmount', 
              parseInt(e.target.value) || 0
            )}
            className="w-16"
          />
          <Select 
            value={rule.halfPayUnit} 
            onValueChange={(value) => onRuleChange(rule.id, 'halfPayUnit', value)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAY_UNIT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
