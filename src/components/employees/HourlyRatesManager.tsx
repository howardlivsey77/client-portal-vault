
import { useState, useEffect } from "react";
import { HourlyRate, fetchEmployeeHourlyRates, createHourlyRate, updateHourlyRate, deleteHourlyRate, setDefaultHourlyRate } from "@/services/hourlyRateService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { HourlyRateTable } from "./hourly-rates/HourlyRateTable";
import { EmptyRateState } from "./hourly-rates/EmptyRateState";
import { HourlyRateDialog } from "./hourly-rates/HourlyRateDialog";

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
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<HourlyRate | null>(null);
  const { toast } = useToast();

  // Fetch rates when employee ID changes or when rates are updated
  useEffect(() => {
    if (employeeId && !isNew) {
      fetchRates();
    }
  }, [employeeId, isNew]);

  const fetchRates = async () => {
    if (!employeeId) return;
    
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

  const handleOpenDialog = (rate: HourlyRate | null = null) => {
    setEditingRate(rate);
    setDialogOpen(true);
  };

  const handleSubmit = async (rateName: string, rateValue: number) => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      if (editingRate) {
        // Update existing rate
        await updateHourlyRate(editingRate.id, {
          rate_name: rateName,
          hourly_rate: rateValue
        });
        toast({
          title: "Rate updated",
          description: `The "${rateName}" hourly rate has been updated.`
        });
      } else {
        // Create new rate
        const newRate = await createHourlyRate({
          employee_id: employeeId,
          rate_name: rateName,
          hourly_rate: rateValue,
          is_default: rates.length === 0 // First rate is default
        });
        
        // If this is the first rate, update the form with its value
        if (rates.length === 0) {
          onDefaultRateChange(rateValue);
        }
        
        toast({
          title: "Rate added",
          description: `The "${rateName}" hourly rate has been added.`
        });
      }
      
      // Refresh rates list and close dialog
      await fetchRates();
      setDialogOpen(false);
      setEditingRate(null);
    } catch (error: any) {
      toast({
        title: "Error saving hourly rate",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, rateName: string) => {
    if (!confirm(`Are you sure you want to delete the "${rateName}" hourly rate?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteHourlyRate(id);
      toast({
        title: "Rate deleted",
        description: `The "${rateName}" hourly rate has been deleted.`
      });
      
      // Refresh rates list
      await fetchRates();
    } catch (error: any) {
      toast({
        title: "Error deleting hourly rate",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (rate: HourlyRate) => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      await setDefaultHourlyRate(employeeId, rate.id);
      onDefaultRateChange(rate.hourly_rate);
      toast({
        title: "Default rate updated",
        description: `"${rate.rate_name}" is now the default hourly rate.`
      });
      
      // Refresh rates list
      await fetchRates();
    } catch (error: any) {
      toast({
        title: "Error updating default rate",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
