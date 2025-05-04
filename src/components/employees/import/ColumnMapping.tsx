
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ArrowRight, Save, Trash2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnMapping, availableFields, fieldLabels } from "./ImportConstants";
import { areRequiredFieldsMapped, saveMappings, clearSavedMappings } from "./ImportUtils";
import { useToast } from "@/hooks/use-toast";

interface ColumnMappingUIProps {
  columnMappings: ColumnMapping[];
  updateColumnMapping: (sourceColumn: string, targetField: string | null) => void;
  applyMappings: () => void;
}

export const ColumnMappingUI = ({ 
  columnMappings, 
  updateColumnMapping, 
  applyMappings 
}: ColumnMappingUIProps) => {
  const requiredFieldsMapped = areRequiredFieldsMapped(columnMappings);
  const { toast } = useToast();
  
  const handleSaveMappings = () => {
    saveMappings(columnMappings);
    toast({
      title: "Mappings saved",
      description: "Your column mappings have been saved for future imports",
    });
  };
  
  const handleClearMappings = () => {
    if (confirm("Are you sure you want to clear your saved mappings?")) {
      clearSavedMappings();
      toast({
        title: "Mappings cleared",
        description: "Your saved column mappings have been deleted",
      });
    }
  };
  
  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Column Mapping</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleSaveMappings}
            title="Save these mappings for future imports"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Mappings
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleClearMappings}
            title="Clear saved mappings"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Saved
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={applyMappings}
            disabled={!requiredFieldsMapped}
          >
            Apply Mapping
          </Button>
        </div>
      </div>
      
      {!requiredFieldsMapped && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Missing required fields</AlertTitle>
          <AlertDescription>
            Please map all required fields: First Name, Last Name, Job Title, Department, and Salary.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="max-h-60 overflow-auto space-y-2">
        {columnMappings.map((mapping, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-1/3 truncate">
              <Label>{mapping.sourceColumn}</Label>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="w-2/3">
              <Select
                value={mapping.targetField || "none"}
                onValueChange={(value) => updateColumnMapping(mapping.sourceColumn, value === "none" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Do not import</SelectItem>
                  {availableFields.map(field => (
                    <SelectItem key={field} value={field}>
                      {fieldLabels[field] || field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
