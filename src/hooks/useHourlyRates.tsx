
import { useState, useCallback } from "react";
import { 
  HourlyRate, 
  fetchEmployeeHourlyRates, 
  createHourlyRate, 
  updateHourlyRate,
  deleteHourlyRate,
  setDefaultHourlyRate 
} from "@/services/hourlyRateService";
import { useToast } from "@/hooks/use-toast";

interface UseHourlyRatesProps {
  employeeId?: string;
  isNew: boolean;
  currentHourlyRate?: number;
  onDefaultRateChange?: (rate: number) => void;
}

export const useHourlyRates = ({
  employeeId,
  isNew,
  currentHourlyRate = 0,
  onDefaultRateChange
}: UseHourlyRatesProps) => {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<HourlyRate | null>(null);
  const { toast } = useToast();

  const fetchRates = useCallback(async () => {
    if (!employeeId || isNew) return;
    
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
  }, [employeeId, isNew, toast]);

  const handleOpenDialog = useCallback((rate: HourlyRate | null = null) => {
    setEditingRate(rate);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (rateName: string, rateValue: number) => {
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
        if (rates.length === 0 && onDefaultRateChange) {
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
  }, [editingRate, employeeId, fetchRates, onDefaultRateChange, rates.length, toast]);

  const handleDelete = useCallback(async (id: string, rateName: string) => {
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
  }, [fetchRates, toast]);

  const handleSetDefault = useCallback(async (rate: HourlyRate) => {
    if (!employeeId || !onDefaultRateChange) return;
    
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
  }, [employeeId, fetchRates, onDefaultRateChange, toast]);

  return {
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
  };
};
