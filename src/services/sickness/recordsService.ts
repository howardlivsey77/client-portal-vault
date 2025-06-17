
import { supabase } from "@/integrations/supabase/client";
import { SicknessRecord } from "@/types/sickness";

export const recordsService = {
  // Fetch sickness records for an employee
  async getSicknessRecords(employeeId: string): Promise<SicknessRecord[]> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Record a new sickness absence
  async recordSicknessAbsence(record: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SicknessRecord> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update sickness record
  async updateSicknessRecord(id: string, updates: Partial<SicknessRecord>): Promise<SicknessRecord> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete sickness record
  async deleteSicknessRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_sickness_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
