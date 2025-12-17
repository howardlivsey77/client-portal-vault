import { useMemo } from "react";
import { useCompanyConfig } from "./useCompanyConfig";
import { TeamnetRateConfig, RateCondition } from "../types/teamnetRateConfig";
import { Json } from "@/integrations/supabase/types";

interface DbTeamnetRateConfig {
  id: string;
  name: string;
  default_rate: number;
  conditions: Json;
  is_active: boolean;
}

const parseConditions = (conditions: Json | null): RateCondition[] => {
  if (!conditions || !Array.isArray(conditions)) return [];
  return conditions as unknown as RateCondition[];
};

export const useTeamnetRateConfigs = () => {
  const configOptions = useMemo(() => ({
    tableName: 'teamnet_rate_configs',
    selectColumns: 'id, name, default_rate, conditions, is_active',
    transformFromDb: (item: DbTeamnetRateConfig): TeamnetRateConfig => ({
      id: item.id,
      name: item.name,
      default_rate: item.default_rate,
      conditions: parseConditions(item.conditions),
      is_active: item.is_active
    }),
    transformToDb: (config: TeamnetRateConfig): Record<string, any> => ({
      name: config.name,
      default_rate: config.default_rate,
      conditions: config.conditions as unknown as Json,
      is_active: config.is_active
    }),
    entityName: 'overtime rate configuration'
  }), []);

  const { items, loading, fetch, save, delete: deleteItem, refresh } = useCompanyConfig<TeamnetRateConfig>(configOptions);

  return {
    configs: items,
    loading,
    fetchConfigs: fetch,
    saveConfig: save,
    deleteConfig: deleteItem,
    refresh
  };
};

// Re-export types for convenience
export type { TeamnetRateConfig, RateCondition } from "../types/teamnetRateConfig";
