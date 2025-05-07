
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useHourlyRates } from "@/hooks/useHourlyRates";

interface HourlyRatesListProps {
  employeeId: string;
}

export const HourlyRatesList = ({ employeeId }: HourlyRatesListProps) => {
  const {
    rates,
    loading,
    fetchRates
  } = useHourlyRates({
    employeeId,
    isNew: false
  });

  useEffect(() => {
    if (employeeId) {
      fetchRates();
    }
  }, [employeeId, fetchRates]);

  if (loading) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No additional hourly rates defined.</p>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      <p className="text-sm font-medium">Hourly Rates:</p>
      <ul className="space-y-1">
        {rates.map(rate => (
          <li key={rate.id} className="flex items-center justify-between text-sm">
            <span>{rate.rate_name}</span>
            <div className="flex items-center gap-2">
              <span>{formatCurrency(rate.hourly_rate)}</span>
              {rate.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
