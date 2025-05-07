
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategorySelectProps {
  category: string;
  onCategoryChange: (value: string) => void;
}

export function CategorySelect({ category, onCategoryChange }: CategorySelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger id="category" className="w-full">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="contracts">Contracts</SelectItem>
          <SelectItem value="reports">Reports</SelectItem>
          <SelectItem value="invoices">Invoices</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
