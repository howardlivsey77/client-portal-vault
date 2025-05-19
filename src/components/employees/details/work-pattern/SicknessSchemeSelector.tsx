
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SicknessScheme } from "./types";
import { useToast } from "@/hooks/use-toast";

interface SicknessSchemeSelectorProps {
  employeeId: string;
  currentSchemeId: string | null;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const SicknessSchemeSelector = ({
  employeeId,
  currentSchemeId,
  isAdmin,
  updateEmployeeField
}: SicknessSchemeSelectorProps) => {
  const [schemes, setSchemes] = useState<SicknessScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // In a real application, we would fetch the schemes from the API
    // For now, we'll use mock data based on what we have in SicknessSettingsTab
    setSchemes([
      { id: "1", name: "Standard Sickness Scheme" },
      { id: "2", name: "Extended Sickness Scheme" }
    ]);
  }, []);
  
  const handleSchemeChange = async (schemeId: string) => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const success = await updateEmployeeField("sickness_scheme_id", schemeId);
      
      if (success) {
        toast({
          title: "Sickness scheme updated",
          description: "The employee's sickness scheme has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error updating sickness scheme",
        description: "There was an error updating the sickness scheme. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="sickness-scheme">Sickness Policy Scheme</Label>
      <Select
        value={currentSchemeId || ""}
        onValueChange={handleSchemeChange}
        disabled={!isAdmin || loading}
      >
        <SelectTrigger id="sickness-scheme" className="w-full">
          <SelectValue placeholder="Select a sickness scheme" />
        </SelectTrigger>
        <SelectContent>
          {schemes.map(scheme => (
            <SelectItem key={scheme.id} value={scheme.id}>
              {scheme.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
