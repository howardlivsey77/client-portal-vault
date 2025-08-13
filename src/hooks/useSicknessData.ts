
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sicknessService } from '@/services/sicknessService';
import { SicknessRecord, EntitlementUsage, SicknessEntitlementSummary, OpeningBalanceData } from '@/types/sickness';
import { EligibilityRule, SicknessScheme } from '@/components/employees/details/work-pattern/types';
import { Employee } from '@/types/employee-types';
import { fetchWorkPatterns } from '@/components/employees/details/work-pattern/services/fetchPatterns';
import { calculateWorkingDaysPerWeek } from '@/components/employees/details/sickness/utils/workPatternCalculations';

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
    if (!entitlementUsage || !employee) return null;

    try {
      const [yearUsage, rollingUsage, workPattern] = await Promise.all([
        sicknessService.calculateUsedDays(employee.id),
        sicknessService.calculateRolling12MonthUsage(employee.id),
        fetchWorkPatterns(employee.id)
      ]);

      const rollingPeriod = sicknessService.getRolling12MonthPeriod();
      const workingDaysPerWeek = calculateWorkingDaysPerWeek(workPattern);

      // SSP entitlement: 28 weeks × working days per week
      const sspEntitledDays = 28 * workingDaysPerWeek;

      // Include opening balance in allowances
      const openingBalanceFullPay = entitlementUsage.opening_balance_full_pay || 0;
      const openingBalanceHalfPay = entitlementUsage.opening_balance_half_pay || 0;

      const fullAllowance = (entitlementUsage.full_pay_entitled_days || 0) + openingBalanceFullPay;
      const halfAllowance = (entitlementUsage.half_pay_entitled_days || 0) + openingBalanceHalfPay;

      // Allocate current year usage across full/half/SSP
      const yearTotalUsed = yearUsage.totalUsed || 0;
      const yearFullUsed = Math.min(yearTotalUsed, fullAllowance);
      const yearRemainingAfterFull = Math.max(0, yearTotalUsed - yearFullUsed);
      const yearHalfUsed = Math.min(yearRemainingAfterFull, halfAllowance);
      const yearSspUsed = Math.max(0, yearTotalUsed - yearFullUsed - yearHalfUsed);

      // Allocate rolling 12-month usage across full/half/SSP
      const rollingTotalUsed = rollingUsage.totalUsed || 0;
      const rollingFullUsed = Math.min(rollingTotalUsed, fullAllowance);
      const rollingRemainingAfterFull = Math.max(0, rollingTotalUsed - rollingFullUsed);
      const rollingHalfUsed = Math.min(rollingRemainingAfterFull, halfAllowance);
      const rollingSspUsed = Math.max(0, rollingTotalUsed - rollingFullUsed - rollingHalfUsed);

      return {
        full_pay_remaining: Math.max(0, fullAllowance - rollingFullUsed),
        half_pay_remaining: Math.max(0, halfAllowance - rollingHalfUsed),
        full_pay_used: yearFullUsed,
        half_pay_used: yearHalfUsed,
        full_pay_used_rolling_12_months: rollingFullUsed,
        half_pay_used_rolling_12_months: rollingHalfUsed,
        opening_balance_full_pay: openingBalanceFullPay,
        opening_balance_half_pay: openingBalanceHalfPay,
        current_tier: entitlementUsage.current_rule_id || 'No tier',
        service_months: entitlementUsage.current_service_months,
        rolling_period_start: rollingPeriod.start,
        rolling_period_end: rollingPeriod.end,
        // SSP fields
        ssp_entitled_days: sspEntitledDays,
        ssp_used_current_year: yearSspUsed,
        ssp_used_rolling_12_months: Math.min(sspEntitledDays, rollingSspUsed),
        ssp_remaining_days: Math.max(0, sspEntitledDays - Math.min(sspEntitledDays, rollingSspUsed))
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
