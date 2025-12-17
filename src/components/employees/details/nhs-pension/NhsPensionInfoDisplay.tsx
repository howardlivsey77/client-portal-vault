import { Employee } from "@/types";
import { Badge } from "@/components/ui/badge";

interface NhsPensionInfoDisplayProps {
  employee: Employee;
}

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return "Not set";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
};

const formatPercentage = (value: number | null): string => {
  if (value === null || value === undefined) return "Auto-calculated";
  return `${value}%`;
};

// Calculate tier based on annual pensionable pay
const calculateTierFromPay = (annualPay: number): { tier: number; rate: number } => {
  // 2025/26 NHS Pension tiers
  const tiers = [
    { tier: 1, max: 13259, rate: 5.1 },
    { tier: 2, max: 16931, rate: 5.7 },
    { tier: 3, max: 22879, rate: 6.1 },
    { tier: 4, max: 27335, rate: 6.8 },
    { tier: 5, max: 30933, rate: 7.7 },
    { tier: 6, max: 37999, rate: 8.8 },
    { tier: 7, max: 49999, rate: 9.8 },
    { tier: 8, max: 69999, rate: 10.7 },
    { tier: 9, max: Infinity, rate: 12.5 },
  ];
  
  for (const { tier, max, rate } of tiers) {
    if (annualPay <= max) {
      return { tier, rate };
    }
  }
  
  return { tier: 9, rate: 12.5 };
};

// Get calculated tier info: prioritize previous year pay, then current salary
const getCalculatedTierInfo = (
  previousYearPay: number | null, 
  monthlySalary: number | null
): { tier: number; rate: number; source: 'previous_year' | 'current_salary'; annualPay: number } | null => {
  if (previousYearPay) {
    return { ...calculateTierFromPay(previousYearPay), source: 'previous_year', annualPay: previousYearPay };
  }
  if (monthlySalary) {
    const annualPay = monthlySalary * 12;
    return { ...calculateTierFromPay(annualPay), source: 'current_salary', annualPay };
  }
  return null;
};

export const NhsPensionInfoDisplay = ({ employee }: NhsPensionInfoDisplayProps) => {
  const isMember = employee.nhs_pension_member ?? false;
  const calculatedTierInfo = getCalculatedTierInfo(
    employee.previous_year_pensionable_pay, 
    employee.monthly_salary
  );
  
  // Show calculated tier if no explicit tier set and we can calculate one
  const showCalculatedTier = isMember && !employee.nhs_pension_tier && calculatedTierInfo;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">NHS Pension Member</p>
          <Badge variant={isMember ? "default" : "secondary"} className="mt-1">
            {isMember ? "Yes" : "No"}
          </Badge>
        </div>
        
        {isMember && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Pension Tier</p>
              <p className="font-medium">
                {employee.nhs_pension_tier 
                  ? `Tier ${employee.nhs_pension_tier}`
                  : showCalculatedTier 
                    ? `Tier ${calculatedTierInfo.tier} (calculated)`
                    : "Not set"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Employee Rate</p>
              <p className="font-medium">
                {employee.nhs_pension_employee_rate 
                  ? `${employee.nhs_pension_employee_rate}%`
                  : showCalculatedTier 
                    ? `${calculatedTierInfo.rate}% (calculated)`
                    : "Auto-calculated"}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Previous Year Pensionable Pay</p>
              <p className="font-medium">
                {employee.previous_year_pensionable_pay 
                  ? formatCurrency(employee.previous_year_pensionable_pay)
                  : "Not set (using current salary)"}
              </p>
            </div>
          </>
        )}
      </div>
      
      {isMember && showCalculatedTier && calculatedTierInfo && (
        <p className="text-xs text-muted-foreground italic">
          Tier calculated from {calculatedTierInfo.source === 'previous_year' ? 'previous year pensionable pay' : 'current annual salary'} of {formatCurrency(calculatedTierInfo.annualPay)}
        </p>
      )}
    </div>
  );
};
