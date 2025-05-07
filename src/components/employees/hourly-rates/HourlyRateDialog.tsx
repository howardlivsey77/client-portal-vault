
import { useState, useEffect } from "react";
import { HourlyRate } from "@/services/hourlyRateService";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HourlyRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRate: HourlyRate | null;
  onSubmit: (rateName: string, hourlyRate: number) => Promise<void>;
  loading: boolean;
}

export const HourlyRateDialog = ({
  open,
  onOpenChange,
  editingRate,
  onSubmit,
  loading
}: HourlyRateDialogProps) => {
  const [rateName, setRateName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0");
  const { toast } = useToast();

  // Update form when editing rate changes
  useEffect(() => {
    if (editingRate) {
      setRateName(editingRate.rate_name);
      setHourlyRate(editingRate.hourly_rate.toString());
    } else {
      setRateName("");
      setHourlyRate("0");
    }
  }, [editingRate]);

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

    await onSubmit(rateName, rateValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingRate ? "Update" : "Add"} Rate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
