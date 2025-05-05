
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";
import { HourlyRatesManager } from "./HourlyRatesManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface CompensationFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
  employeeId?: string;
  isNew: boolean;
}

export const CompensationFields = ({ form, readOnly, employeeId, isNew }: CompensationFieldsProps) => {
  const handleDefaultRateChange = (rate: number) => {
    form.setValue("hourly_rate", rate);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">      
        <FormField
          control={form.control}
          name="hours_per_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours Per Week *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="40"
                  min={0}
                  step="0.5"
                  {...field} 
                  disabled={readOnly}
                />
              </FormControl>
              <FormDescription>Standard working hours per week</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hourly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Hourly Rate (GBP) *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                  {...field} 
                  disabled={readOnly}
                />
              </FormControl>
              <FormDescription>Base hourly rate (for overtime calculations)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md">Multiple Hourly Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <HourlyRatesManager 
            employeeId={employeeId} 
            readOnly={readOnly} 
            isNew={isNew}
            currentHourlyRate={form.getValues("hourly_rate") || 0}
            onDefaultRateChange={handleDefaultRateChange} 
          />
        </CardContent>
      </Card>
    </div>
  );
};
