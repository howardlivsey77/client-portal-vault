import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers/CompanyProvider";

export interface PeriodPayrollData {
  period: number;
  label: string;
  grossPay: number;
  overtimePay: number;
  costToEmployer: number;
  grossVariance: number | null;
  overtimeVariance: number | null;
  costVariance: number | null;
}

export interface PayrollSummaryData {
  periods: PeriodPayrollData[];
  totals: {
    grossPay: number;
    overtimePay: number;
    costToEmployer: number;
  };
}

const MONTH_NAMES = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

function generateExampleOvertimePay(period: number, hasData: boolean): number {
  if (!hasData) return 0;
  // Generate example overtime as ~5-15% of a base amount
  const baseOvertimes = [320, 450, 280, 510, 390, 420, 350, 480, 410, 380, 520, 440];
  return baseOvertimes[(period - 1) % 12] * 100; // Return in pence
}

export function usePayrollSummaryData(taxYear: string) {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  return useQuery({
    queryKey: ["payroll-summary-all-periods", companyId, taxYear],
    queryFn: async (): Promise<PayrollSummaryData> => {
      if (!companyId) {
        return {
          periods: [],
          totals: { grossPay: 0, overtimePay: 0, costToEmployer: 0 },
        };
      }

      const { data, error } = await supabase
        .from("payroll_results")
        .select("tax_period, gross_pay_this_period, nic_employer_this_period, employer_pension_this_period, nhs_pension_employer_this_period")
        .eq("company_id", companyId)
        .eq("tax_year", taxYear);

      if (error) {
        console.error("Error fetching payroll summary:", error);
        throw error;
      }

      // Group by tax_period
      const periodMap = new Map<number, { grossPay: number; employerNic: number; employerPension: number; nhsPension: number }>();
      
      for (const row of data || []) {
        const period = row.tax_period || 0;
        if (period < 1 || period > 12) continue;
        
        const existing = periodMap.get(period) || { grossPay: 0, employerNic: 0, employerPension: 0, nhsPension: 0 };
        periodMap.set(period, {
          grossPay: existing.grossPay + (row.gross_pay_this_period || 0),
          employerNic: existing.employerNic + (row.nic_employer_this_period || 0),
          employerPension: existing.employerPension + (row.employer_pension_this_period || 0),
          nhsPension: existing.nhsPension + (row.nhs_pension_employer_this_period || 0),
        });
      }

      // Build period data with variances
      const [startYear] = taxYear.split("/").map(Number);
      const periods: PeriodPayrollData[] = [];
      let prevGross: number | null = null;
      let prevOvertime: number | null = null;
      let prevCost: number | null = null;

      for (let p = 1; p <= 12; p++) {
        const periodData = periodMap.get(p);
        const hasData = !!periodData;
        
        const year = p <= 9 ? startYear + 2000 : startYear + 2001;
        const label = `${MONTH_NAMES[p - 1]} ${year}`;

        const grossPay = periodData?.grossPay || 0;
        const overtimePay = generateExampleOvertimePay(p, hasData);
        const costToEmployer = grossPay + (periodData?.employerNic || 0) + (periodData?.employerPension || 0) + (periodData?.nhsPension || 0);

        // Calculate variances (current - previous)
        const grossVariance = prevGross !== null && hasData ? grossPay - prevGross : null;
        const overtimeVariance = prevOvertime !== null && hasData ? overtimePay - prevOvertime : null;
        const costVariance = prevCost !== null && hasData ? costToEmployer - prevCost : null;

        periods.push({
          period: p,
          label,
          grossPay: grossPay / 100,
          overtimePay: overtimePay / 100,
          costToEmployer: costToEmployer / 100,
          grossVariance: grossVariance !== null ? grossVariance / 100 : null,
          overtimeVariance: overtimeVariance !== null ? overtimeVariance / 100 : null,
          costVariance: costVariance !== null ? costVariance / 100 : null,
        });

        if (hasData) {
          prevGross = grossPay;
          prevOvertime = overtimePay;
          prevCost = costToEmployer;
        }
      }

      const totals = {
        grossPay: periods.reduce((sum, p) => sum + p.grossPay, 0),
        overtimePay: periods.reduce((sum, p) => sum + p.overtimePay, 0),
        costToEmployer: periods.reduce((sum, p) => sum + p.costToEmployer, 0),
      };

      return { periods, totals };
    },
    enabled: !!companyId,
  });
}
