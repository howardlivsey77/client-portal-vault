
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sicknessService } from '@/services/sicknessService';
import { SicknessRecord, EntitlementUsage, SicknessEntitlementSummary, OpeningBalanceData } from '@/types/sickness';
import { EligibilityRule, SicknessScheme } from '@/components/employees/details/work-pattern/types';
import { Employee } from '@/types/employee-types';

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
      setEntitlementUsage(usage);

      // If no entitlement usage exists and employee has a scheme, create it
      if (!usage && sicknessScheme && employee.hire_date) {
        await createInitialEntitlementUsage();
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

  const calculateEntitlementSummary = async (): Promise<SicknessEntitlementSummary | null> => {
    if (!entitlementUsage || !employee) return null;

    try {
      const [usedDays, rollingUsage] = await Promise.all([
        sicknessService.calculateUsedDays(employee.id),
        sicknessService.calculateRolling12MonthUsage(employee.id)
      ]);

      const rollingPeriod = sicknessService.getRolling12MonthPeriod();
      
      // Include opening balance in calculations
      const openingBalanceFullPay = entitlementUsage.opening_balance_full_pay || 0;
      const openingBalanceHalfPay = entitlementUsage.opening_balance_half_pay || 0;
      
      // Rolling 12-month usage includes opening balance
      const totalRollingFullPay = rollingUsage.fullPayUsed + openingBalanceFullPay;
      const totalRollingHalfPay = rollingUsage.halfPayUsed + openingBalanceHalfPay;
      
      return {
        full_pay_remaining: Math.max(0, entitlementUsage.full_pay_entitled_days - totalRollingFullPay),
        half_pay_remaining: Math.max(0, entitlementUsage.half_pay_entitled_days - totalRollingHalfPay),
        full_pay_used: usedDays.fullPayUsed,
        half_pay_used: usedDays.halfPayUsed,
        full_pay_used_rolling_12_months: totalRollingFullPay,
        half_pay_used_rolling_12_months: totalRollingHalfPay,
        opening_balance_full_pay: openingBalanceFullPay,
        opening_balance_half_pay: openingBalanceHalfPay,
        current_tier: entitlementUsage.current_rule_id || 'No tier',
        service_months: entitlementUsage.current_service_months,
        rolling_period_start: rollingPeriod.start,
        rolling_period_end: rollingPeriod.end
      };
    } catch (error) {
      console.error('Error calculating entitlement summary:', error);
      return null;
    }
  };

  const setOpeningBalance = async (openingBalance: OpeningBalanceData) => {
    if (!employee) return;

    try {
      const updatedUsage = await sicknessService.setOpeningBalance(
        employee.id,
        employee.company_id || '',
        openingBalance
      );
      
      setEntitlementUsage(updatedUsage);
      
      toast({
        title: "Opening balance set",
        description: "The opening sickness balance has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error setting opening balance",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addSicknessRecord = async (recordData: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRecord = await sicknessService.recordSicknessAbsence(recordData);
      setSicknessRecords(prev => [newRecord, ...prev]);
      
      toast({
        title: "Sickness record added",
        description: "The sickness absence has been recorded successfully."
      });

      // Refresh entitlement data
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
    setOpeningBalance,
    addSicknessRecord,
    updateSicknessRecord,
    deleteSicknessRecord
  };
};
