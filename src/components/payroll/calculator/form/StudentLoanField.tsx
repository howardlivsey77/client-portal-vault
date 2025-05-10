
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface StudentLoanFieldProps {
  studentLoanPlan: number | null;
  onInputChange: (field: string, value: any) => void;
}

export function StudentLoanField({ studentLoanPlan, onInputChange }: StudentLoanFieldProps) {
  return (
    <div>
      <Label htmlFor="studentLoan">Student Loan Plan</Label>
      <Select
        value={studentLoanPlan?.toString() || "none"}
        onValueChange={(value) => {
          const planNumber = value !== "none" ? parseInt(value, 10) : null;
          onInputChange('studentLoanPlan', planNumber);
        }}
      >
        <SelectTrigger id="studentLoan">
          <SelectValue placeholder="No student loan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No student loan</SelectItem>
          <SelectItem value="1">Plan 1</SelectItem>
          <SelectItem value="2">Plan 2</SelectItem>
          <SelectItem value="4">Plan 4 (Scotland)</SelectItem>
          <SelectItem value="5">Plan 5 (Postgraduate)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
