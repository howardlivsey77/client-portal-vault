
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { SicknessScheme, EligibilityRule } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Scheme name is required")
});

interface SicknessSchemeFormProps {
  scheme: SicknessScheme | null;
  onSave: (scheme: SicknessScheme) => void;
  onCancel: () => void;
}

export function SicknessSchemeForm({ scheme, onSave, onCancel }: SicknessSchemeFormProps) {
  const [eligibilityRules, setEligibilityRules] = useState<EligibilityRule[]>(
    scheme?.eligibilityRules || []
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: scheme?.name || ""
    }
  });

  const handleAddRule = () => {
    const newRule: EligibilityRule = {
      id: `rule-${Date.now()}`,
      serviceMonthsFrom: 0,
      serviceMonthsTo: 0,
      companyPaidDays: 0,
      sicknessPay: "SSP"
    };
    setEligibilityRules([...eligibilityRules, newRule]);
  };

  const handleRuleChange = (id: string, field: keyof EligibilityRule, value: any) => {
    setEligibilityRules(
      eligibilityRules.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleRemoveRule = (id: string) => {
    setEligibilityRules(eligibilityRules.filter(rule => rule.id !== id));
  };

  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    const updatedScheme: SicknessScheme = {
      id: scheme?.id || "",
      name: formData.name,
      eligibilityRules
    };
    onSave(updatedScheme);
  };

  const validateRules = (): boolean => {
    if (eligibilityRules.length === 0) return false;
    
    // Additional validation logic could be added here
    return true;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
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

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">Eligibility Rules</h3>
              <Button type="button" onClick={handleAddRule} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> 
                Add Rule
              </Button>
            </div>

            {eligibilityRules.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service From (Months)</TableHead>
                      <TableHead>Service To (Months)</TableHead>
                      <TableHead>Company Paid (Days)</TableHead>
                      <TableHead>Then</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibilityRules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Input 
                            type="number"
                            min="0"
                            value={rule.serviceMonthsFrom}
                            onChange={(e) => handleRuleChange(
                              rule.id, 
                              'serviceMonthsFrom', 
                              parseInt(e.target.value) || 0
                            )}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            min="0"
                            value={rule.serviceMonthsTo}
                            onChange={(e) => handleRuleChange(
                              rule.id, 
                              'serviceMonthsTo', 
                              parseInt(e.target.value) || 0
                            )}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            min="0"
                            value={rule.companyPaidDays}
                            onChange={(e) => handleRuleChange(
                              rule.id, 
                              'companyPaidDays', 
                              parseInt(e.target.value) || 0
                            )}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={rule.sicknessPay} 
                            onValueChange={(value) => handleRuleChange(rule.id, 'sicknessPay', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SSP">SSP Only</SelectItem>
                              <SelectItem value="NoSSP">No Pay</SelectItem>
                              <SelectItem value="FullPay">Full Pay</SelectItem>
                              <SelectItem value="HalfPay">Half Pay</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveRule(rule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border border-dashed rounded-md p-8 text-center">
                <p className="text-muted-foreground">No eligibility rules defined</p>
                <Button type="button" onClick={handleAddRule} variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" /> 
                  Add Rule
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!validateRules()}
          >
            {scheme ? "Update Scheme" : "Create Scheme"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
