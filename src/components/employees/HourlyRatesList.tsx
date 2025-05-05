
import { useState, useEffect } from "react";
import { HourlyRate, fetchEmployeeHourlyRates } from "@/services/hourlyRateService";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface HourlyRatesListProps {
  employeeId: string;
}

export const HourlyRatesList = ({ employeeId }: HourlyRatesListProps) => {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (employeeId) {
      fetchRates();
    }
  }, [employeeId]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployeeHourlyRates(employeeId);
      setRates(data);
    } catch (error: any) {
      toast({
        title: "Error fetching hourly rates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
