import { useState, useEffect } from 'react';
import { useToast } from '@/hooks';
import { sicknessService } from '@/services';
import { SicknessRecord, EntitlementUsage, SicknessEntitlementSummary, Employee } from '@/types';
import { EligibilityRule, SicknessScheme } from '@/components/employees/details/work-pattern/types';
import { calculateSicknessEntitlementSummary } from '@/utils';

export const useSicknessData = (
  employee: Employee | null, 
  sicknessScheme: SicknessScheme | null
) => {
  const [sicknessRecords, setSicknessRecords] = useState<SicknessRecord[]>([]);
  const [entitlementUsage, setEntitlementUsage] = useState<EntitlementUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSicknessData = async () => {
    if (!employee?.id) return;

    setLoading(true);
    try {
      const [records, usage] = await Promise.all([
        sicknessService.getSicknessRecords(employee.id),
        sicknessService.getEntitlementUsage(employee.id)
      ]);

      setSicknessRecords(records);

      // Always recalculate used days using rolling 12-month window
      if (records.length > 0) {
        await sicknessService.recalculateEmployeeUsedDays(employee.id);
        // Re-fetch usage after recalculation
        const refreshedUsage = await sicknessService.getEntitlementUsage(employee.id);
        setEntitlementUsage(refreshedUsage);
      } else {
        setEntitlementUsage(usage);
      }

      // If no entitlement usage exists and employee has a scheme, create it
      if (!usage && sicknessScheme && employee.hire_date) {
        await createInitialEntitlementUsage();
      } else if (usage && sicknessScheme && employee.hire_date) {
        // Check if we need to recalculate existing entitlement
        await recalculateIfNeeded(usage);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching sickness data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createInitialEntitlementUsage = async () => {
    if (!employee || !sicknessScheme) return;

    console.log('Creating initial entitlement usage for employee:', employee.id);

    const serviceMonths = sicknessService.calculateServiceMonths(employee.hire_date);
    const applicableRule = sicknessService.findApplicableRule(
      serviceMonths, 
      sicknessScheme.eligibilityRules || []
    );

    try {
      const usage = await sicknessService.createOrUpdateEntitlementUsage(
        employee.id,
        employee.company_id || '',
        sicknessScheme.id,
        serviceMonths,
        applicableRule
      );
      setEntitlementUsage(usage);
    } catch (error: any) {
      console.error('Error creating entitlement usage:', error);
    }
  };

  const recalculateIfNeeded = async (currentUsage: EntitlementUsage) => {
    if (!employee || !sicknessScheme) return;

    console.log('Checking if recalculation is needed for employee:', employee.id);

    const serviceMonths = sicknessService.calculateServiceMonths(employee.hire_date);
    const applicableRule = sicknessService.findApplicableRule(
      serviceMonths, 
      sicknessScheme.eligibilityRules || []
    );

    // Check if service months or rule has changed, or if we need to recalculate based on work pattern
    const needsRecalculation = 
      currentUsage.current_service_months !== serviceMonths ||
      currentUsage.current_rule_id !== (applicableRule?.id || null) ||
      // Force recalculation to ensure work pattern is considered
      true;

    if (needsRecalculation) {
      console.log('Recalculation needed, updating entitlement...');
      try {
        const updatedUsage = await sicknessService.recalculateExistingEntitlement(
          employee.id,
          employee.company_id || '',
          sicknessScheme.id,
          serviceMonths,
          applicableRule
        );
        if (updatedUsage) {
          setEntitlementUsage(updatedUsage);
        }
      } catch (error: any) {
        console.error('Error recalculating entitlement:', error);
      }
    }
  };

  const calculateEntitlementSummary = async (): Promise<SicknessEntitlementSummary | null> => {
    if (!employee) return null;
    return calculateSicknessEntitlementSummary(employee);
  };


  const addSicknessRecord = async (recordData: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRecord = await sicknessService.recordSicknessAbsence(recordData);
      setSicknessRecords(prev => [newRecord, ...prev]);
      
      toast({
        title: "Sickness record added",
        description: "The sickness absence has been recorded successfully."
      });

      // Refresh entitlement data and recalculate used days
      await sicknessService.recalculateEmployeeUsedDays(employee.id);
      await fetchSicknessData();
    } catch (error: any) {
      toast({
        title: "Error adding sickness record",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateSicknessRecord = async (id: string, updates: Partial<SicknessRecord>) => {
    try {
      const updatedRecord = await sicknessService.updateSicknessRecord(id, updates);
      setSicknessRecords(prev => 
        prev.map(record => record.id === id ? updatedRecord : record)
      );
      
      toast({
        title: "Sickness record updated",
        description: "The sickness record has been updated successfully."
      });

      // Recalculate used days
      await sicknessService.recalculateEmployeeUsedDays(employee.id);
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
      
      toast({
        title: "Sickness record deleted",
        description: "The sickness record has been deleted successfully."
      });

      // Recalculate used days
      await sicknessService.recalculateEmployeeUsedDays(employee.id);
    } catch (error: any) {
      toast({
        title: "Error deleting sickness record",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSicknessData();
  }, [employee?.id, sicknessScheme?.id]);

  return {
    sicknessRecords,
    entitlementUsage,
    loading,
    fetchSicknessData,
    calculateEntitlementSummary,
    addSicknessRecord,
    updateSicknessRecord,
    deleteSicknessRecord
  };
};
