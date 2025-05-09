
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

// Define the schema for timesheet settings
const timesheetSettingsSchema = z.object({
  earlyClockInTolerance: z.coerce.number().min(0).max(60),
  lateClockInTolerance: z.coerce.number().min(0).max(60),
  earlyClockOutTolerance: z.coerce.number().min(0).max(60),
  lateClockOutTolerance: z.coerce.number().min(0).max(60),
  roundClockTimes: z.boolean().default(false),
  roundingIntervalMinutes: z.coerce.number().min(1).max(30).optional(),
  requireManagerApproval: z.boolean().default(true),
  allowEmployeeNotes: z.boolean().default(true)
});

type TimesheetSettingsFormValues = z.infer<typeof timesheetSettingsSchema>;

const TimesheetSettings = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Set default values for the form
  const defaultValues: TimesheetSettingsFormValues = {
    earlyClockInTolerance: 15,
    lateClockInTolerance: 5,
    earlyClockOutTolerance: 5,
    lateClockOutTolerance: 15,
    roundClockTimes: true,
    roundingIntervalMinutes: 15,
    requireManagerApproval: true,
    allowEmployeeNotes: true
  };

  const form = useForm<TimesheetSettingsFormValues>({
    resolver: zodResolver(timesheetSettingsSchema),
    defaultValues
  });

  const { watch } = form;
  const roundClockTimes = watch("roundClockTimes");

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
    <PageContainer>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-6">Timesheet Settings</h1>
        
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Timesheet Configuration</CardTitle>
            <CardDescription>
              Configure settings and tolerances for employee clock-in/out activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Clock-in Tolerances</h3>
                    
                    <FormField
                      control={form.control}
                      name="earlyClockInTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Early Clock-in Tolerance (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            How many minutes before scheduled start time an employee can clock in.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lateClockInTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Clock-in Tolerance (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            How many minutes after scheduled start time before considered late.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Clock-out Tolerances</h3>
                    
                    <FormField
                      control={form.control}
                      name="earlyClockOutTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Early Clock-out Tolerance (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            How many minutes before scheduled end time an employee can clock out.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lateClockOutTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Clock-out Tolerance (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            How many minutes after scheduled end time before overtime is counted.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Time Rounding</h3>
                  
                  <FormField
                    control={form.control}
                    name="roundClockTimes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Round Clock Times</FormLabel>
                          <FormDescription>
                            Round clock-in and clock-out times to the nearest interval.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {roundClockTimes && (
                    <FormField
                      control={form.control}
                      name="roundingIntervalMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rounding Interval (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Times will be rounded to the nearest interval (e.g., 15 minutes).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Approval Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="requireManagerApproval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Require Manager Approval</FormLabel>
                          <FormDescription>
                            Timesheet entries require manager approval before being finalized.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allowEmployeeNotes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Employee Notes</FormLabel>
                          <FormDescription>
                            Employees can add notes to explain timesheet discrepancies.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default TimesheetSettings;
