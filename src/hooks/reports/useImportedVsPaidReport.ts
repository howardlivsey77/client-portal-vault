import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/providers/CompanyProvider';

export interface ImportAuditRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  payroll_id: string | null;
  import_type: string;
  rate_type: string | null;
  imported_units: number | null;
  imported_rate: number | null;
  imported_value: number | null;
  imported_at: string;
  source_file_name: string | null;
}

export interface ImportedVsPaidFilters {
  periodNumber: number;
  financialYear: number;
  importType: string;
  employeeId?: string;
}

export function useImportedVsPaidReport() {
  const { currentCompany } = useCompany();
  const [reportData, setReportData] = useState<ImportAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ImportedVsPaidFilters>(() => {
    // Default to current financial year period 1
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      periodNumber: 1,
      financialYear: year,
      importType: 'extra_hours'
    };
  });
  const [availablePeriods, setAvailablePeriods] = useState<{ periodNumber: number; financialYear: number }[]>([]);

  const fetchAvailablePeriods = useCallback(async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('payroll_import_audit')
        .select('period_number, financial_year')
        .eq('company_id', currentCompany.id)
        .order('financial_year', { ascending: false })
        .order('period_number', { ascending: false });

      if (error) throw error;

      // Get unique period/year combinations
      const unique = new Map<string, { periodNumber: number; financialYear: number }>();
      data?.forEach(row => {
        const key = `${row.financial_year}-${row.period_number}`;
        if (!unique.has(key)) {
          unique.set(key, { periodNumber: row.period_number, financialYear: row.financial_year });
        }
      });

      setAvailablePeriods(Array.from(unique.values()));
    } catch (error) {
      console.error('Error fetching available periods:', error);
    }
  }, [currentCompany?.id]);

  const fetchReportData = useCallback(async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      // Fetch import audit records with employee info
      const { data, error } = await supabase
        .from('payroll_import_audit')
        .select(`
          id,
          employee_id,
          import_type,
          rate_type,
          imported_units,
          imported_rate,
          imported_value,
          imported_at,
          source_file_name
        `)
        .eq('company_id', currentCompany.id)
        .eq('period_number', filters.periodNumber)
        .eq('financial_year', filters.financialYear)
        .eq('import_type', filters.importType)
        .order('imported_at', { ascending: false });

      if (error) throw error;

      // Fetch employee names for the records
      const employeeIds = [...new Set(data?.map(r => r.employee_id) || [])];
      
      let employeeMap: Record<string, { name: string; payroll_id: string | null }> = {};
      if (employeeIds.length > 0) {
        const { data: employees } = await supabase
          .from('employees')
          .select('id, first_name, last_name, payroll_id')
          .in('id', employeeIds);
        
        employees?.forEach(emp => {
          employeeMap[emp.id] = {
            name: `${emp.first_name} ${emp.last_name}`,
            payroll_id: emp.payroll_id
          };
        });
      }

      // Combine data
      const enrichedData: ImportAuditRecord[] = (data || []).map(record => ({
        ...record,
        employee_name: employeeMap[record.employee_id]?.name || 'Unknown',
        payroll_id: employeeMap[record.employee_id]?.payroll_id || null
      }));

      setReportData(enrichedData);
    } catch (error) {
      console.error('Error fetching import audit data:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, filters]);

  useEffect(() => {
    fetchAvailablePeriods();
  }, [fetchAvailablePeriods]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const refreshData = useCallback(() => {
    fetchAvailablePeriods();
    fetchReportData();
  }, [fetchAvailablePeriods, fetchReportData]);

  // Calculate totals
  const totals = reportData.reduce(
    (acc, record) => ({
      importedUnits: acc.importedUnits + (record.imported_units || 0),
      importedValue: acc.importedValue + (record.imported_value || 0)
    }),
    { importedUnits: 0, importedValue: 0 }
  );

  return {
    reportData,
    loading,
    refreshData,
    filters,
    setFilters,
    availablePeriods,
    totals
  };
}
