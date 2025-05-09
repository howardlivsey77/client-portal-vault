
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ClockInTolerancesSection } from "./ClockInTolerancesSection";
import { ClockOutTolerancesSection } from "./ClockOutTolerancesSection";
import { TimeRoundingSection } from "./TimeRoundingSection";
import { ApprovalSettingsSection } from "./ApprovalSettingsSection";
import { timesheetSettingsSchema, defaultSettingsValues, TimesheetSettingsFormValues } from "./schema";

export function TimesheetSettingsForm() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<TimesheetSettingsFormValues>({
    resolver: zodResolver(timesheetSettingsSchema),
    defaultValues: defaultSettingsValues
  });

  const onSubmit = async (data: TimesheetSettingsFormValues) => {
    setIsSaving(true);
    
    try {
      // Here you would save the settings to your database
      // For now, we'll just simulate a save with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Your timesheet settings have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was an error saving your timesheet settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClockInTolerancesSection form={form} />
          <ClockOutTolerancesSection form={form} />
        </div>
        
        <TimeRoundingSection form={form} />
        
        <ApprovalSettingsSection form={form} />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
