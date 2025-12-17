import { Employee } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface NhsPensionInfoFormProps {
  employee: Employee;
  isEditing: boolean;
  toggleEditMode: () => void;
  onSubmit: (values: any) => Promise<boolean>;
}

export const NhsPensionInfoForm = ({ 
  employee, 
  isEditing, 
  toggleEditMode, 
  onSubmit 
}: NhsPensionInfoFormProps) => {
  const [formData, setFormData] = useState({
    nhs_pension_member: employee.nhs_pension_member ?? false,
    previous_year_pensionable_pay: employee.previous_year_pensionable_pay ?? "",
    nhs_pension_tier: employee.nhs_pension_tier ?? "",
    nhs_pension_employee_rate: employee.nhs_pension_employee_rate ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submitData = {
      nhs_pension_member: formData.nhs_pension_member,
      previous_year_pensionable_pay: formData.previous_year_pensionable_pay === "" 
        ? null 
        : Number(formData.previous_year_pensionable_pay),
      nhs_pension_tier: formData.nhs_pension_tier === "" 
        ? null 
        : Number(formData.nhs_pension_tier),
      nhs_pension_employee_rate: formData.nhs_pension_employee_rate === "" 
        ? null 
        : Number(formData.nhs_pension_employee_rate),
    };
    
    await onSubmit(submitData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="nhs_pension_member"
          checked={formData.nhs_pension_member}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, nhs_pension_member: checked }))
          }
        />
        <Label htmlFor="nhs_pension_member">NHS Pension Member</Label>
      </div>
      
      {formData.nhs_pension_member && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="previous_year_pensionable_pay">Previous Year Pensionable Pay</Label>
            <Input
              id="previous_year_pensionable_pay"
              type="number"
              step="0.01"
              placeholder="Leave blank to use current salary"
              value={formData.previous_year_pensionable_pay}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, previous_year_pensionable_pay: e.target.value }))
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nhs_pension_tier">Pension Tier (1-9)</Label>
            <Input
              id="nhs_pension_tier"
              type="number"
              min="1"
              max="9"
              placeholder="Auto-calculated if blank"
              value={formData.nhs_pension_tier}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, nhs_pension_tier: e.target.value }))
              }
            />
          </div>
          
          <div className="space-y-2 col-span-2">
            <Label htmlFor="nhs_pension_employee_rate">Employee Rate (%)</Label>
            <Input
              id="nhs_pension_employee_rate"
              type="number"
              step="0.1"
              placeholder="Auto-calculated from tier"
              value={formData.nhs_pension_employee_rate}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, nhs_pension_employee_rate: e.target.value }))
              }
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={toggleEditMode}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};
