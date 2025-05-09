
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PayrollConstantFormProps {
  constant: TaxConstant | null;
  category: string;
  onSave: (constant: Partial<TaxConstant>) => void;
  onCancel: () => void;
}

const FormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value_numeric: z.string().optional().refine(val => !val || !isNaN(Number(val)), {
    message: "Must be a valid number",
  }),
  value_text: z.string().optional(),
  description: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
});

export function PayrollConstantForm({ constant, category, onSave, onCancel }: PayrollConstantFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      key: constant?.key || "",
      value_numeric: constant?.value_numeric !== null ? String(constant.value_numeric) : "",
      value_text: constant?.value_text || "",
      description: constant?.description || "",
      region: constant?.region || "UK",
      effective_from: constant?.effective_from ? new Date(constant.effective_from).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      effective_to: constant?.effective_to ? new Date(constant.effective_to).toISOString().split('T')[0] : "",
    },
  });

  const handleSubmit = (values: z.infer<typeof FormSchema>) => {
    // Convert numeric value from string to number
    const numericValue = values.value_numeric ? parseFloat(values.value_numeric) : null;
    
    onSave({
      ...values,
      value_numeric: numericValue,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter constant key" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="Scotland">Scotland</SelectItem>
                    <SelectItem value="Wales">Wales</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value_numeric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numeric Value</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="Enter numeric value (if applicable)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="value_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text Value</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter text value (if applicable)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="effective_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Effective From</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="effective_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Effective To (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter description (optional)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {constant ? "Update" : "Add"} Constant
          </Button>
        </div>
      </form>
    </Form>
  );
}
