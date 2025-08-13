
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
    // Some deployments do not return the inserted row due to RLS/return=minimal.
    // Use maybeSingle() and fall back to fetching the latest record for the employee.
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .insert(record)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (data) return data as SicknessRecord;

    // Fallback: fetch the most recent record for this employee (assumes sequential inserts)
    const { data: fallback, error: fallbackError } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('employee_id', (record as any).employee_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    if (!fallback) throw new Error('Sickness record inserted but no row returned');
    return fallback as SicknessRecord;
  },

  // Update sickness record
  async updateSicknessRecord(id: string, updates: Partial<SicknessRecord>): Promise<SicknessRecord> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (data) return data as SicknessRecord;

    // Fallback: fetch the record by id
    const { data: fallback, error: fallbackError } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    if (!fallback) throw new Error('Sickness record updated but no row returned');
    return fallback as SicknessRecord;
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
