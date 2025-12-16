import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";

interface DateInputFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  maxDate?: Date;
  minDate?: Date;
  inputClassName?: string;
}

export const DateInputField = ({ 
  control, 
  name, 
  label, 
  required, 
  readOnly,
  maxDate,
  minDate,
  inputClassName 
}: DateInputFieldProps) => {
  
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} {required && "*"}</FormLabel>
          <FormControl>
            <Input
              type="date"
              value={formatDateForInput(field.value)}
              onChange={(e) => {
                const date = parseDateFromInput(e.target.value);
                field.onChange(date);
              }}
              readOnly={readOnly}
              disabled={readOnly}
              max={maxDate ? formatDateForInput(maxDate) : undefined}
              min={minDate ? formatDateForInput(minDate) : undefined}
              className={cn(
                "w-full",
                readOnly && "bg-gray-50",
                inputClassName
              )}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};