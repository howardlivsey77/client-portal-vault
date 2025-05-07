
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { HourlyRateTable } from "./hourly-rates/HourlyRateTable";
import { EmptyRateState } from "./hourly-rates/EmptyRateState";
import { HourlyRateDialog } from "./hourly-rates/HourlyRateDialog";
import { useHourlyRates } from "@/hooks/useHourlyRates";

interface HourlyRatesManagerProps {
  employeeId?: string;
  readOnly: boolean;
  isNew: boolean;
  currentHourlyRate?: number;
  onDefaultRateChange: (rate: number) => void;
}

export const HourlyRatesManager = ({ 
  employeeId, 
  readOnly, 
  isNew, 
  currentHourlyRate = 0,
  onDefaultRateChange 
}: HourlyRatesManagerProps) => {
  const {
    rates,
    loading,
    dialogOpen,
    editingRate,
    fetchRates,
    handleOpenDialog,
    handleSubmit,
    handleDelete,
    handleSetDefault,
    setDialogOpen
  } = useHourlyRates({
    employeeId,
    isNew,
    currentHourlyRate,
    onDefaultRateChange
  });

  // Fetch rates when employee ID changes or when rates are updated
  useEffect(() => {
    if (employeeId && !isNew) {
      fetchRates();
    }
  }, [employeeId, isNew, fetchRates]);

  if (isNew) {
    return (
      <div className="text-sm text-muted-foreground italic">
        You can add additional hourly rates after saving the employee record.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Hourly Rates</h3>
        {!readOnly && (
          <Button 
            onClick={() => handleOpenDialog()}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Rate
          </Button>
        )}
      </div>

      {loading && rates.length === 0 ? (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rates.length > 0 ? (
        <HourlyRateTable 
          rates={rates}
          readOnly={readOnly}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
        />
      ) : (
        <EmptyRateState 
          readOnly={readOnly} 
          onAddRate={() => handleOpenDialog()} 
        />
      )}

      <HourlyRateDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingRate={editingRate}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};
