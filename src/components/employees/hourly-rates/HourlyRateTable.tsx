
import { HourlyRate } from "@/services/hourlyRateService";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface HourlyRateTableProps {
  rates: HourlyRate[];
  readOnly: boolean;
  onEdit: (rate: HourlyRate) => void;
  onDelete: (id: string, rateName: string) => void;
  onSetDefault: (rate: HourlyRate) => void;
}

export const HourlyRateTable = ({ 
  rates, 
  readOnly, 
  onEdit, 
  onDelete, 
  onSetDefault 
}: HourlyRateTableProps) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead>Default</TableHead>
            {!readOnly && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map(rate => (
            <TableRow key={rate.id}>
              <TableCell>{rate.rate_name}</TableCell>
              <TableCell className="text-right">{formatCurrency(rate.hourly_rate)}</TableCell>
              <TableCell>
                {rate.is_default ? (
                  <Badge variant="default">Default</Badge>
                ) : !readOnly ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onSetDefault(rate)}
                  >
                    Set as default
                  </Button>
                ) : null}
              </TableCell>
              {!readOnly && (
                <TableCell className="text-right space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(rate)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDelete(rate.id, rate.rate_name)}
                    disabled={rate.is_default} // Prevent deleting default rate
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
