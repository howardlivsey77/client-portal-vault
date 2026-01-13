import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, SicknessRecord, SicknessEntitlementSummary } from '@/types';
import { SicknessScheme, WorkDay } from '@/components/employees/details/work-pattern/types';
import { sicknessService } from '@/services';
import { fetchWorkPatterns } from '@/components/employees/details/work-pattern/services/fetchPatterns';
import { calculateSicknessEntitlementSummary } from '@/utils';
import { useToast } from '@/hooks';

export interface PayPeriodFilter {
  periodNumber: number;
  year: number;
}

export const usePayrollSicknessData = (
  employeeId: string | null,
  payPeriod?: PayPeriodFilter
) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sicknessScheme, setSicknessScheme] = useState<SicknessScheme | null>(null);
  const [sicknessRecords, setSicknessRecords] = useState<SicknessRecord[]>([]);
  const [entitlementSummary, setEntitlementSummary] = useState<SicknessEntitlementSummary | null>(null);
  const [workPattern, setWorkPattern] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      // Fetch employee
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;
      const emp = empData as unknown as Employee;
      setEmployee(emp);

      // Fetch work pattern
      const patterns = await fetchWorkPatterns(employeeId);
      setWorkPattern(patterns);

      // Fetch sickness scheme if employee has one
      if (emp.sickness_scheme_id) {
        const { data: schemeData, error: schemeError } = await supabase
          .from('sickness_schemes')
          .select('*')
          .eq('id', emp.sickness_scheme_id)
          .single();

        if (!schemeError && schemeData) {
          setSicknessScheme(schemeData as unknown as SicknessScheme);
        }
      }

      // Fetch sickness records
      const records = await sicknessService.getSicknessRecords(employeeId);
      
      // Filter by payroll period if specified
      const filteredRecords = payPeriod
        ? records.filter(r => 
            r.payroll_period_number === payPeriod.periodNumber &&
            r.payroll_financial_year === payPeriod.year
          )
        : records;
      
      setSicknessRecords(filteredRecords);

      // Calculate entitlement summary
      const summary = await calculateSicknessEntitlementSummary(emp);
      setEntitlementSummary(summary);

    } catch (error: any) {
      console.error('Error fetching sickness data:', error);
      toast({
        title: "Error loading sickness data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSicknessRecord = async (recordData: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRecord = await sicknessService.recordSicknessAbsence(recordData);
      setSicknessRecords(prev => [newRecord, ...prev]);

      // Recalculate used days
      if (employee?.id) {
        await sicknessService.recalculateEmployeeUsedDays(employee.id);
        const summary = await calculateSicknessEntitlementSummary(employee);
        setEntitlementSummary(summary);
      }

      toast({
        title: "Sickness record added",
        description: "The sickness absence has been recorded successfully."
      });

      return newRecord;
    } catch (error: any) {
      toast({
        title: "Error adding sickness record",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSicknessRecord = async (id: string, updates: Partial<SicknessRecord>) => {
    try {
      const updatedRecord = await sicknessService.updateSicknessRecord(id, updates);
      setSicknessRecords(prev =>
        prev.map(record => record.id === id ? updatedRecord : record)
      );

      // Recalculate used days
      if (employee?.id) {
        await sicknessService.recalculateEmployeeUsedDays(employee.id);
        const summary = await calculateSicknessEntitlementSummary(employee);
        setEntitlementSummary(summary);
      }

      toast({
        title: "Sickness record updated",
        description: "The sickness record has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error updating sickness record",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteSicknessRecord = async (id: string) => {
    try {
      await sicknessService.deleteSicknessRecord(id);
      setSicknessRecords(prev => prev.filter(record => record.id !== id));

      // Recalculate used days
      if (employee?.id) {
        await sicknessService.recalculateEmployeeUsedDays(employee.id);
        const summary = await calculateSicknessEntitlementSummary(employee);
        setEntitlementSummary(summary);
      }

      toast({
        title: "Sickness record deleted",
        description: "The sickness record has been deleted successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error deleting sickness record",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId, payPeriod?.periodNumber, payPeriod?.year]);

  return {
    employee,
    sicknessScheme,
    sicknessRecords,
    entitlementSummary,
    workPattern,
    loading,
    fetchData,
    addSicknessRecord,
    updateSicknessRecord,
    deleteSicknessRecord
  };
};
