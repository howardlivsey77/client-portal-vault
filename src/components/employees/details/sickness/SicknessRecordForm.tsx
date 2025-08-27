
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SicknessRecord } from "@/types/sickness";
import { sicknessRecordSchema, SicknessRecordFormData } from "./SicknessRecordFormSchema";
import { SicknessRecordFormFields } from "./SicknessRecordFormFields";
import { getDefaultTotalDays } from "./utils/dateCalculations";
import { calculateWorkingDaysForRecord } from "./utils/workingDaysCalculations";
import { fetchWorkPatterns } from "@/components/employees/details/work-pattern/services/fetchPatterns";

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
  const [workPattern, setWorkPattern] = useState<any[]>([]);

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

  // Fetch work pattern when form opens
  useEffect(() => {
    if (open && employeeId) {
      fetchWorkPatterns(employeeId).then(setWorkPattern);
    }
  }, [open, employeeId]);

  const onSubmit = async (data: SicknessRecordFormData) => {
    setLoading(true);
    try {
      // Use already fetched work pattern
      const workingDays = calculateWorkingDaysForRecord(
        data.start_date,
        data.end_date || null,
        workPattern
      );

      const recordData = {
        employee_id: employeeId,
        company_id: companyId,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        total_days: workingDays, // Use calculated working days
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
            <SicknessRecordFormFields form={form} workPattern={workPattern} />

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
