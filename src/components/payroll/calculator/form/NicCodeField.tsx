
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface NicCodeFieldProps {
  nicCode: string;
  onInputChange: (field: string, value: any) => void;
}

export function NicCodeField({ nicCode, onInputChange }: NicCodeFieldProps) {
  return (
    <div>
      <Label htmlFor="nicCode">NI Category</Label>
      <Select
        value={nicCode || "A"}
        onValueChange={(value) => onInputChange('nicCode', value)}
      >
        <SelectTrigger id="nicCode">
          <SelectValue placeholder="Select NI category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="A">A - Standard rate</SelectItem>
          <SelectItem value="B">B - Married woman's reduced rate</SelectItem>
          <SelectItem value="C">C - Pension age</SelectItem>
          <SelectItem value="H">H - Apprentice under 25</SelectItem>
          <SelectItem value="J">J - Deferred NI</SelectItem>
          <SelectItem value="M">M - Under 21</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
