
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SicknessRecord } from "@/types/sickness";

const sicknessRecordSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  total_days: z.number().min(0, "Total days must be positive"),
  is_certified: z.boolean().default(false),
  certification_required_from_day: z.number().min(1).default(8),
  reason: z.string().optional(),
  notes: z.string().optional()
});

type SicknessRecordFormData = z.infer<typeof sicknessRecordSchema>;

interface SicknessRecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: SicknessRecord | null;
  employeeId: string;
  companyId: string;
  onSave: (data: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const SicknessRecordForm = ({
  open,
  onOpenChange,
  record,
  employeeId,
  companyId,
  onSave
}: SicknessRecordFormProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<SicknessRecordFormData>({
    resolver: zodResolver(sicknessRecordSchema),
    defaultValues: {
      start_date: record?.start_date || "",
      end_date: record?.end_date || "",
      total_days: record?.total_days || 0,
      is_certified: record?.is_certified || false,
      certification_required_from_day: record?.certification_required_from_day || 8,
      reason: record?.reason || "",
      notes: record?.notes || ""
    }
  });

  // Calculate total days when dates change
  const calculateTotalDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
    
    return Math.max(0, diffDays);
  };

  const onSubmit = async (data: SicknessRecordFormData) => {
    setLoading(true);
    try {
      // Calculate total days if not manually set
      let totalDays = data.total_days;
      if (data.start_date && data.end_date && totalDays === 0) {
        totalDays = calculateTotalDays(data.start_date, data.end_date);
      } else if (data.start_date && !data.end_date && totalDays === 0) {
        totalDays = 1; // Default to 1 day for ongoing absence
      }

      const recordData = {
        employee_id: employeeId,
        company_id: companyId,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        total_days: totalDays,
        is_certified: data.is_certified,
        certification_required_from_day: data.certification_required_from_day,
        reason: data.reason || undefined,
        notes: data.notes || undefined,
        created_by: undefined // Will be set by backend
      };

      await onSave(recordData);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving sickness record:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Edit Sickness Record' : 'Add Sickness Record'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Days</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.5"
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_certified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Medically Certified</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief description of illness" />
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
                      placeholder="Additional notes or comments"
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
                {loading ? 'Saving...' : record ? 'Update' : 'Add'} Record
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
