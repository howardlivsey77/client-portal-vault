
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PersonalInfoFormValues } from "./types";

interface PersonalInfoRateFieldsProps {
  control: Control<PersonalInfoFormValues>;
}

export const PersonalInfoRateFields = ({ control }: PersonalInfoRateFieldsProps) => {
  return (
    <>
      <div>
        <FormField
          control={control}
          name="hours_per_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours Per Week</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField
            control={control}
            name="hourly_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Hourly Rate</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="rate_2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard Overtime (GBP)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    value={field.value ?? ''} 
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField
            control={control}
            name="rate_3"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enhanced Access (GBP)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    value={field.value ?? ''} 
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="rate_4"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate 4 (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    value={field.value ?? ''} 
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );
};
