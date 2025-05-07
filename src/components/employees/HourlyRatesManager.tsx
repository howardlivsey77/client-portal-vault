
import { useEffect } from "react";
import { HourlyRateTable } from "./hourly-rates/HourlyRateTable";
import { EmptyRateState } from "./hourly-rates/EmptyRateState";
import { HourlyRateDialog } from "./hourly-rates/HourlyRateDialog";
import { HourlyRatesHeader } from "./hourly-rates/HourlyRatesHeader";
import { HourlyRatesLoading } from "./hourly-rates/HourlyRatesLoading";
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
      <HourlyRatesHeader 
        readOnly={readOnly} 
        onAddRate={() => handleOpenDialog()} 
      />

      {loading && rates.length === 0 ? (
        <HourlyRatesLoading />
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
