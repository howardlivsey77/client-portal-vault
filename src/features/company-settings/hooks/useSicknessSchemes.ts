import { useMemo } from "react";
import { useCompanyConfig } from "./useCompanyConfig";
import { SicknessScheme } from "../types";
import { Json } from "@/integrations/supabase/types";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";

interface DbSicknessScheme {
  id: string;
  name: string;
  eligibility_rules: Json | null;
}

// Function to migrate old eligibility rules to new format
const migrateEligibilityRules = (rules: any[]): EligibilityRule[] => {
  return rules.map(rule => {
    // Handle migration from old format to new flexible format
    if (rule.serviceMonthsFrom !== undefined && rule.serviceFrom === undefined) {
      return {
        ...rule,
        serviceFrom: rule.serviceMonthsFrom || 0,
        serviceTo: rule.serviceMonthsTo || null,
        serviceFromUnit: 'months',
        serviceToUnit: 'months',
        fullPayAmount: rule.fullPayDays || rule.companyPaidDays || 0,
        halfPayAmount: rule.halfPayDays || 0,
        fullPayUnit: 'days',
        halfPayUnit: 'days'
      };
    }
    
    // If new format or already migrated, ensure all fields exist
    return {
      ...rule,
      serviceFrom: rule.serviceFrom ?? rule.serviceMonthsFrom ?? 0,
      serviceTo: rule.serviceTo ?? rule.serviceMonthsTo ?? null,
      serviceFromUnit: rule.serviceFromUnit ?? 'months',
      serviceToUnit: rule.serviceToUnit ?? 'months',
      fullPayAmount: rule.fullPayAmount ?? rule.fullPayDays ?? rule.companyPaidDays ?? 0,
      halfPayAmount: rule.halfPayAmount ?? rule.halfPayDays ?? 0,
      fullPayUnit: rule.fullPayUnit ?? 'days',
      halfPayUnit: rule.halfPayUnit ?? 'days'
    };
  });
};

export const useSicknessSchemes = () => {
  const configOptions = useMemo(() => ({
    tableName: 'sickness_schemes',
    selectColumns: 'id, name, eligibility_rules',
    transformFromDb: (item: DbSicknessScheme): SicknessScheme => ({
      id: item.id,
      name: item.name,
      eligibilityRules: item.eligibility_rules 
        ? migrateEligibilityRules(JSON.parse(item.eligibility_rules as string)) 
        : null
    }),
    transformToDb: (scheme: SicknessScheme): Record<string, any> => ({
      name: scheme.name,
      eligibility_rules: JSON.stringify(scheme.eligibilityRules) as Json
    }),
    entityName: 'sickness scheme'
  }), []);

  const { items, loading, fetch, save, delete: deleteItem, refresh } = useCompanyConfig<SicknessScheme>(configOptions);

  return {
    schemes: items,
    loading,
    fetchSicknessSchemes: fetch,
    saveScheme: save,
    deleteScheme: deleteItem,
    refresh
  };
};
