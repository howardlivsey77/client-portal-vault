
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getTaxYear } from "@/utils/taxYearUtils";

interface TaxYearFieldProps {
  taxYear: string;
  onInputChange: (field: string, value: any) => void;
}

export function TaxYearField({ taxYear, onInputChange }: TaxYearFieldProps) {
  // Get the current tax year
  const currentTaxYear = getTaxYear();
  
  return (
    <div>
      <Label htmlFor="taxYear">Tax Year</Label>
      <Select
        value={taxYear || currentTaxYear}
        onValueChange={(value) => onInputChange('taxYear', value)}
      >
        <SelectTrigger id="taxYear">
          <SelectValue placeholder="Select tax year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentTaxYear}>{currentTaxYear} (Current)</SelectItem>
          <SelectItem value={(parseInt(currentTaxYear.split('-')[0], 10) - 1) + '-' + currentTaxYear.split('-')[0]}>
            {(parseInt(currentTaxYear.split('-')[0], 10) - 1) + '-' + currentTaxYear.split('-')[0]} (Previous)
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">UK tax year: 6 Apr to 5 Apr</p>
    </div>
  );
}
