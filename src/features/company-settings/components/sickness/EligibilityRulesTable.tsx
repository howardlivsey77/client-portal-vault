
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { EligibilityRuleRow } from "./EligibilityRuleRow";

interface EligibilityRulesTableProps {
  eligibilityRules: EligibilityRule[];
  onAddRule: () => void;
  onRuleChange: (id: string, field: keyof EligibilityRule, value: any) => void;
  onRemoveRule: (id: string) => void;
}

export function EligibilityRulesTable({ 
  eligibilityRules, 
  onAddRule, 
  onRuleChange, 
  onRemoveRule 
}: EligibilityRulesTableProps) {
  if (eligibilityRules.length === 0) {
    return (
      <div className="border border-dashed rounded-md p-8 text-center">
        <p className="text-muted-foreground">No eligibility rules defined</p>
        <Button type="button" onClick={onAddRule} variant="outline" size="sm" className="mt-2">
          <Plus className="h-4 w-4 mr-2" /> 
          Add Rule
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service From (Months)</TableHead>
            <TableHead>Service To (Months)</TableHead>
            <TableHead>Full Pay (Days)</TableHead>
            <TableHead>Half Pay (Days)</TableHead>
            <TableHead>Then</TableHead>
            <TableHead className="w-[80px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eligibilityRules.map(rule => (
            <EligibilityRuleRow
              key={rule.id}
              rule={rule}
              onRuleChange={onRuleChange}
              onRemoveRule={onRemoveRule}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
