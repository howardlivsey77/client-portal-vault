import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Grid3X3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SortField } from './hooks/usePayrollTableData';

interface PayrollTableHeaderProps {
  sortBy: SortField;
  onSortChange: (value: SortField) => void;
  paymentDate: Date | undefined;
  onPaymentDateChange: (date: Date | undefined) => void;
}

export function PayrollTableHeader({
  sortBy,
  onSortChange,
  paymentDate,
  onPaymentDateChange,
}: PayrollTableHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-6">
        <RadioGroup
          value={sortBy}
          onValueChange={(value) => onSortChange(value as SortField)}
          className="flex items-center gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="payrollId" id="sort-id" />
            <Label htmlFor="sort-id" className="cursor-pointer">
              Sort By Id
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="name" id="sort-name" />
            <Label htmlFor="sort-name" className="cursor-pointer">
              Sort By Name
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Payment Date:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[180px] justify-start text-left font-normal',
                  !paymentDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {paymentDate ? format(paymentDate, 'dd/MM/yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={paymentDate}
                onSelect={onPaymentDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="ghost" size="icon" title="Grid view">
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
