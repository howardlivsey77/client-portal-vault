import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";
import { Json } from "@/integrations/supabase/types";

export interface RateCondition {
  rate: number;
  days: string[];
  time_from: string;
  time_to: string;
}

export interface TeamnetRateConfig {
  id?: string;
  name: string;
  default_rate: number;
  conditions: RateCondition[];
  is_active: boolean;
}

export const useTeamnetRateConfigs = () => {
  const [configs, setConfigs] = useState<TeamnetRateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();

  const parseConditions = (conditions: Json | null): RateCondition[] => {
    if (!conditions || !Array.isArray(conditions)) return [];
    return conditions as unknown as RateCondition[];
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      
      if (!currentCompany?.id) {
        console.log("No current company selected");
        setConfigs([]);
        return;
      }

      const { data, error } = await supabase
        .from('teamnet_rate_configs')
        .select('id, name, default_rate, conditions, is_active')
        .eq('company_id', currentCompany.id);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const transformedData: TeamnetRateConfig[] = data.map(item => ({
          id: item.id,
          name: item.name,
          default_rate: item.default_rate,
          conditions: parseConditions(item.conditions),
          is_active: item.is_active
        }));
        setConfigs(transformedData);
      }
    } catch (error: any) {
      console.error("Error fetching teamnet rate configs:", error.message);
      toast.error("Error loading configs", {
        description: "There was a problem loading overtime rate configurations."
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (config: TeamnetRateConfig) => {
    try {
      if (!currentCompany?.id) {
        return { 
          success: false, 
          message: "No company selected. Please select a company first."
        };
      }

      if (config.id) {
        // Update existing config
        const { error } = await supabase
          .from('teamnet_rate_configs')
          .update({ 
            name: config.name,
            default_rate: config.default_rate,
            conditions: config.conditions as unknown as Json,
            is_active: config.is_active
          })
          .eq('id', config.id)
          .eq('company_id', currentCompany.id);
          
        if (error) throw error;
        
        setConfigs(configs.map(c => c.id === config.id ? config : c));
        return { success: true, message: `${config.name} has been updated successfully.` };
      } else {
        // Add new config
        const { data, error } = await supabase
          .from('teamnet_rate_configs')
          .insert({ 
            name: config.name,
            company_id: currentCompany.id,
            default_rate: config.default_rate,
            conditions: config.conditions as unknown as Json,
            is_active: config.is_active
          })
          .select();
          
        if (error) throw error;
        
        if (data && data[0]) {
          const newConfig: TeamnetRateConfig = {
            id: data[0].id,
            name: data[0].name,
            default_rate: data[0].default_rate,
            conditions: parseConditions(data[0].conditions),
            is_active: data[0].is_active
          };
          setConfigs([...configs, newConfig]);
          return { success: true, message: `${config.name} has been added successfully.` };
        }
      }
      return { success: false, message: "Operation completed but with unexpected results." };
    } catch (error: any) {
      console.error("Error saving config:", error.message);
      return { 
        success: false, 
        message: "There was a problem saving the configuration. Please try again."
      };
    }
  };

  const deleteConfig = async (configId: string) => {
    try {
      if (!currentCompany?.id) {
        return { success: false, message: "No company selected." };
      }

      const { error } = await supabase
        .from('teamnet_rate_configs')
        .delete()
        .eq('id', configId)
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      setConfigs(configs.filter(c => c.id !== configId));
      return { success: true, message: "Configuration deleted successfully." };
    } catch (error: any) {
      console.error("Error deleting config:", error.message);
      return { success: false, message: "Failed to delete configuration." };
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [currentCompany?.id]);

  return {
    configs,
    loading,
    fetchConfigs,
    saveConfig,
    deleteConfig
  };
};

