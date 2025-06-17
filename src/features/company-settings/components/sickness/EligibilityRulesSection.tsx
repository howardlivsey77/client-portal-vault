
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { EligibilityRulesTable } from "./EligibilityRulesTable";

interface EligibilityRulesSectionProps {
  eligibilityRules: EligibilityRule[];
  onAddRule: () => void;
  onRuleChange: (id: string, field: keyof EligibilityRule, value: any) => void;
  onRemoveRule: (id: string) => void;
}

export function EligibilityRulesSection({ 
  eligibilityRules, 
  onAddRule, 
  onRuleChange, 
  onRemoveRule 
}: EligibilityRulesSectionProps) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium">Eligibility Rules</h3>
        <Button type="button" onClick={onAddRule} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" /> 
          Add Rule
        </Button>
      </div>

      <EligibilityRulesTable
        eligibilityRules={eligibilityRules}
        onAddRule={onAddRule}
        onRuleChange={onRuleChange}
        onRemoveRule={onRemoveRule}
      />
    </div>
  );
}
