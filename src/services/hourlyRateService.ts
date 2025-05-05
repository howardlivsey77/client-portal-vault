
import { supabase } from "@/integrations/supabase/client";

export interface HourlyRate {
  id: string;
  employee_id: string;
  rate_name: string;
  hourly_rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchEmployeeHourlyRates = async (employeeId: string) => {
  const { data, error } = await supabase
    .from("employee_hourly_rates")
    .select("*")
    .eq("employee_id", employeeId)
    .order("is_default", { ascending: false });
    
  if (error) throw error;
  
  return data as HourlyRate[];
};

export const createHourlyRate = async (rate: Omit<HourlyRate, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from("employee_hourly_rates")
    .insert(rate)
    .select()
    .single();
    
  if (error) throw error;
  
  return data as HourlyRate;
};

export const updateHourlyRate = async (id: string, changes: Partial<Omit<HourlyRate, 'id' | 'employee_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from("employee_hourly_rates")
    .update(changes)
    .eq("id", id)
    .select()
    .single();
    
  if (error) throw error;
  
  return data as HourlyRate;
};

export const deleteHourlyRate = async (id: string) => {
  const { error } = await supabase
    .from("employee_hourly_rates")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
};

export const setDefaultHourlyRate = async (employeeId: string, rateId: string) => {
  // First, set all rates for this employee to not default
  await supabase
    .from("employee_hourly_rates")
    .update({ is_default: false })
    .eq("employee_id", employeeId);
    
  // Then set the selected rate as default
  const { data, error } = await supabase
    .from("employee_hourly_rates")
    .update({ is_default: true })
    .eq("id", rateId)
    .select()
    .single();
    
  if (error) throw error;
  
  return data as HourlyRate;
};
