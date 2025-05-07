
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompensationFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
  employeeId?: string;
  isNew: boolean;
}

export const CompensationFields = ({ form, readOnly }: CompensationFieldsProps) => {
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
          <CardTitle className="text-md">Additional Hourly Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="rate_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate 2 (GBP)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rate_3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate 3 (GBP)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rate_4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate 4 (GBP)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
