
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SicknessScheme } from "../types";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { sicknessSchemeFormSchema, SicknessSchemeFormData } from "./sickness/SicknessSchemeFormSchema";
import { SicknessSchemeBasicInfo } from "./sickness/SicknessSchemeBasicInfo";
import { EligibilityRulesSection } from "./sickness/EligibilityRulesSection";

interface SicknessSchemeFormProps {
  scheme: SicknessScheme | null;
  onSave: (scheme: SicknessScheme) => void;
  onCancel: () => void;
}

export function SicknessSchemeForm({ scheme, onSave, onCancel }: SicknessSchemeFormProps) {
  // Migrate legacy data to new format with proper defaults
  const migrateRulesToNewFormat = (rules: EligibilityRule[]): EligibilityRule[] => {
    return rules.map(rule => ({
      ...rule,
      // Ensure all required fields have proper non-empty values
      serviceFrom: rule.serviceFrom ?? rule.serviceMonthsFrom ?? 0,
      serviceTo: rule.serviceTo ?? rule.serviceMonthsTo ?? null,
      serviceFromUnit: rule.serviceFromUnit || 'months',
      serviceToUnit: rule.serviceToUnit || 'months',
      fullPayAmount: rule.fullPayAmount ?? rule.fullPayDays ?? 0,
      halfPayAmount: rule.halfPayAmount ?? rule.halfPayDays ?? 0,
      fullPayUnit: rule.fullPayUnit || 'days',
      halfPayUnit: rule.halfPayUnit || 'days',
      sicknessPay: rule.sicknessPay || 'SSP'
    }));
  };

  const [eligibilityRules, setEligibilityRules] = useState<EligibilityRule[]>(
    scheme?.eligibilityRules ? migrateRulesToNewFormat(scheme.eligibilityRules) : []
  );

  const form = useForm<SicknessSchemeFormData>({
    resolver: zodResolver(sicknessSchemeFormSchema),
    defaultValues: {
      name: scheme?.name || ""
    }
  });

  const handleAddRule = () => {
    const newRule: EligibilityRule = {
      id: `rule-${Date.now()}`,
      serviceFrom: 0,
      serviceTo: null,
      serviceFromUnit: 'months',
      serviceToUnit: 'months',
      fullPayAmount: 0,
      halfPayAmount: 0,
      fullPayUnit: 'days',
      halfPayUnit: 'days',
      sicknessPay: "SSP"
    };
    setEligibilityRules([...eligibilityRules, newRule]);
  };

  const handleRuleChange = (id: string, field: keyof EligibilityRule, value: any) => {
    setEligibilityRules(
      eligibilityRules.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleRemoveRule = (id: string) => {
    setEligibilityRules(eligibilityRules.filter(rule => rule.id !== id));
  };

  const onSubmit = (formData: SicknessSchemeFormData) => {
    const updatedScheme: SicknessScheme = {
      id: scheme?.id || "",
      name: formData.name,
      eligibilityRules
    };
    onSave(updatedScheme);
  };

  const validateRules = (): boolean => {
    if (eligibilityRules.length === 0) return false;
    
    // Additional validation logic could be added here
    return true;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 py-4">
          <SicknessSchemeBasicInfo control={form.control} />

          <EligibilityRulesSection
            eligibilityRules={eligibilityRules}
            onAddRule={handleAddRule}
            onRuleChange={handleRuleChange}
            onRemoveRule={handleRemoveRule}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!validateRules()}
          >
            {scheme ? "Update Scheme" : "Create Scheme"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
