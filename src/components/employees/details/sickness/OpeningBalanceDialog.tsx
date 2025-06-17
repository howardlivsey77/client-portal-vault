
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OpeningBalanceData } from "@/types/sickness";
import { CalendarDays, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const openingBalanceSchema = z.object({
  full_pay_days: z.number().min(0, "Full pay days must be 0 or greater"),
  half_pay_days: z.number().min(0, "Half pay days must be 0 or greater"),
  reference_date: z.string().min(1, "Reference date is required"),
  notes: z.string().optional()
});

type OpeningBalanceFormData = z.infer<typeof openingBalanceSchema>;

interface OpeningBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: {
    full_pay: number;
    half_pay: number;
    date?: string;
    notes?: string;
  };
  onSave: (data: OpeningBalanceData) => Promise<void>;
}

export const OpeningBalanceDialog = ({
  open,
  onOpenChange,
  currentBalance,
  onSave
}: OpeningBalanceDialogProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<OpeningBalanceFormData>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      full_pay_days: currentBalance?.full_pay || 0,
      half_pay_days: currentBalance?.half_pay || 0,
      reference_date: currentBalance?.date || "",
      notes: currentBalance?.notes || ""
    }
  });

  const onSubmit = async (data: OpeningBalanceFormData) => {
    setLoading(true);
    try {
      await onSave({
        full_pay_days: data.full_pay_days,
        half_pay_days: data.half_pay_days,
        reference_date: data.reference_date,
        notes: data.notes
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving opening balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Set Opening Balance
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Opening balances represent sickness days used in the previous 12 months 
            before the system implementation. This ensures accurate rolling calculations.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reference_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      placeholder="Date when opening balance was calculated"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_pay_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Pay Days Used</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.5"
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="half_pay_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Half Pay Days Used</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.5"
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes about this opening balance..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Opening Balance'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
