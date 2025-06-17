
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { SicknessSchemeFormData } from "./SicknessSchemeFormSchema";

interface SicknessSchemeBasicInfoProps {
  control: Control<SicknessSchemeFormData>;
}

export function SicknessSchemeBasicInfo({ control }: SicknessSchemeBasicInfoProps) {
  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Scheme Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter scheme name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
