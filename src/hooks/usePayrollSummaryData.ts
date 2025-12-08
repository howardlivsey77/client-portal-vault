import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers/CompanyProvider";

export interface PayrollSummaryData {
  totalGross: number;
  totalTax: number;
  totalNicEmployee: number;
  totalNicEmployer: number;
  employeeCount: number;
  periodLabel: string;
}

export function usePayrollSummaryData(taxYear: string, taxPeriod: number) {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  return useQuery({
    queryKey: ["payroll-summary", companyId, taxYear, taxPeriod],
    queryFn: async (): Promise<PayrollSummaryData> => {
      if (!companyId) {
        return {
          totalGross: 0,
          totalTax: 0,
          totalNicEmployee: 0,
          totalNicEmployer: 0,
          employeeCount: 0,
          periodLabel: "",
        };
      }

      const { data, error } = await supabase
        .from("payroll_results")
        .select("gross_pay_this_period, income_tax_this_period, nic_employee_this_period, nic_employer_this_period")
        .eq("company_id", companyId)
        .eq("tax_year", taxYear)
        .eq("tax_period", taxPeriod);

      if (error) {
        console.error("Error fetching payroll summary:", error);
        throw error;
      }

      const results = data || [];
      
      // Values are stored in pence, convert to pounds
      const totalGross = results.reduce((sum, r) => sum + (r.gross_pay_this_period || 0), 0) / 100;
      const totalTax = results.reduce((sum, r) => sum + (r.income_tax_this_period || 0), 0) / 100;
      const totalNicEmployee = results.reduce((sum, r) => sum + (r.nic_employee_this_period || 0), 0) / 100;
      const totalNicEmployer = results.reduce((sum, r) => sum + (r.nic_employer_this_period || 0), 0) / 100;

      // Generate period label (e.g., "Period 1 - Apr 2025")
      const [startYear] = taxYear.split("/").map(Number);
      const monthIndex = (taxPeriod - 1 + 3) % 12; // Tax period 1 = April
      const year = monthIndex < 3 ? startYear + 2001 : startYear + 2000;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const periodLabel = `Period ${taxPeriod} - ${monthNames[monthIndex]} ${year}`;

      return {
        totalGross,
        totalTax,
        totalNicEmployee,
        totalNicEmployer,
        employeeCount: results.length,
        periodLabel,
      };
    },
    enabled: !!companyId,
  });
}
