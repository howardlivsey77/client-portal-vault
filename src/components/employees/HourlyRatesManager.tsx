
import { useState, useEffect } from "react";
import { HourlyRate, fetchEmployeeHourlyRates, createHourlyRate, updateHourlyRate, deleteHourlyRate, setDefaultHourlyRate } from "@/services/hourlyRateService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Check } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

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
  const [rateName, setRateName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0");
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
    if (rate) {
      setRateName(rate.rate_name);
      setHourlyRate(rate.hourly_rate.toString());
    } else {
      setRateName("");
      setHourlyRate("0");
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRate(null);
    setRateName("");
    setHourlyRate("0");
  };

  const handleSubmit = async () => {
    if (!rateName.trim()) {
      toast({
        title: "Rate name required",
        description: "Please enter a name for this hourly rate",
        variant: "destructive"
      });
      return;
    }

    const rateValue = parseFloat(hourlyRate);
    if (isNaN(rateValue) || rateValue < 0) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid hourly rate (must be a positive number)",
        variant: "destructive"
      });
      return;
    }

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
      } else if (employeeId) {
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
      
      // Refresh rates list
      if (employeeId) {
        await fetchRates();
      }
      
      // Close dialog
      handleCloseDialog();
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
      if (employeeId) {
        await fetchRates();
      }
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
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Default</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map(rate => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.rate_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(rate.hourly_rate)}</TableCell>
                  <TableCell>
                    {rate.is_default ? (
                      <Badge variant="default">Default</Badge>
                    ) : !readOnly ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetDefault(rate)}
                      >
                        Set as default
                      </Button>
                    ) : null}
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(rate)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(rate.id, rate.rate_name)}
                        disabled={rate.is_default} // Prevent deleting default rate
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-4 text-center text-muted-foreground border rounded-md">
          No hourly rates defined yet.
          {!readOnly && (
            <div className="mt-2">
              <Button 
                variant="link" 
                onClick={() => handleOpenDialog()}
              >
                Add your first hourly rate
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog for adding/editing rates */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRate ? "Edit Hourly Rate" : "Add Hourly Rate"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="rate-name" className="text-right font-medium">
                Name
              </label>
              <Input
                id="rate-name"
                value={rateName}
                onChange={(e) => setRateName(e.target.value)}
                placeholder="e.g., Standard Rate, Overtime Rate"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="hourly-rate" className="text-right font-medium">
                Rate (GBP)
              </label>
              <Input
                id="hourly-rate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                step="0.01"
                min="0"
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRate ? "Update" : "Add"} Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
