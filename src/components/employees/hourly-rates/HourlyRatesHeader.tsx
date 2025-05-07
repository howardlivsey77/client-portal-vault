
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface HourlyRatesHeaderProps {
  readOnly: boolean;
  onAddRate: () => void;
}

export const HourlyRatesHeader = ({ readOnly, onAddRate }: HourlyRatesHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Hourly Rates</h3>
      {!readOnly && (
        <Button 
          onClick={onAddRate}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Rate
        </Button>
      )}
    </div>
  );
};
