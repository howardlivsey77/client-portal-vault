
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface TaxRegionFieldProps {
  taxRegion: string;
  onInputChange: (field: string, value: any) => void;
}

export function TaxRegionField({ taxRegion, onInputChange }: TaxRegionFieldProps) {
  return (
    <div>
      <Label htmlFor="taxRegion">Tax Region</Label>
      <Select
        value={taxRegion}
        onValueChange={(value) => onInputChange('taxRegion', value)}
      >
        <SelectTrigger id="taxRegion">
          <SelectValue placeholder="Select tax region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="UK">England & Northern Ireland</SelectItem>
          <SelectItem value="Scotland">Scotland</SelectItem>
          <SelectItem value="Wales">Wales</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
