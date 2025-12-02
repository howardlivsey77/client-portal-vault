import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, X } from 'lucide-react';
import { OvertimeItem } from './types';
import { formatPounds } from '@/lib/formatters';

interface EmployeeRates {
  hourlyRate: number;
  rate2: number | null;
  rate3: number | null;
  rate4: number | null;
}

interface OvertimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeRates: EmployeeRates;
  initialItems: OvertimeItem[];
  onSave: (items: OvertimeItem[]) => void;
}

const rateMultipliers = [
  { value: '1', label: '1x' },
  { value: '1.5', label: '1.5x' },
  { value: '2', label: '2x' },
];

export function OvertimeDialog({
  open,
  onOpenChange,
  employeeName,
  employeeRates,
  initialItems,
  onSave,
}: OvertimeDialogProps) {
  const [items, setItems] = useState<OvertimeItem[]>(initialItems);

  useEffect(() => {
    if (open) {
      setItems(initialItems.length > 0 ? initialItems : [createEmptyItem()]);
    }
  }, [open, initialItems]);

  const availableRates = [
    { value: employeeRates.hourlyRate.toString(), label: `Rate 1: ${formatPounds(employeeRates.hourlyRate)}` },
    ...(employeeRates.rate2 ? [{ value: employeeRates.rate2.toString(), label: `Rate 2: ${formatPounds(employeeRates.rate2)}` }] : []),
    ...(employeeRates.rate3 ? [{ value: employeeRates.rate3.toString(), label: `Rate 3: ${formatPounds(employeeRates.rate3)}` }] : []),
    ...(employeeRates.rate4 ? [{ value: employeeRates.rate4.toString(), label: `Rate 4: ${formatPounds(employeeRates.rate4)}` }] : []),
  ];

  function createEmptyItem(): OvertimeItem {
    return {
      id: crypto.randomUUID(),
      hours: 0,
      rateMultiplier: 1,
      hourlyRate: employeeRates.hourlyRate,
      amount: 0,
    };
  }

  function updateItem(id: string, field: keyof OvertimeItem, value: number) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.amount = updated.hours * updated.rateMultiplier * updated.hourlyRate;
      return updated;
    }));
  }

  function addItem() {
    setItems(prev => [...prev, createEmptyItem()]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  function handleSave() {
    const validItems = items.filter(item => item.hours > 0 && item.amount > 0);
    onSave(validItems);
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Overtime - {employeeName}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="text-destructive hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Hours</th>
                <th className="px-3 py-2 text-left font-medium">Rate</th>
                <th className="px-3 py-2 text-left font-medium">Hourly Rate</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.hours || ''}
                      onChange={(e) => updateItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                      className="w-20 h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={item.rateMultiplier.toString()}
                      onValueChange={(v) => updateItem(item.id, 'rateMultiplier', parseFloat(v))}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rateMultipliers.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={item.hourlyRate.toString()}
                      onValueChange={(v) => updateItem(item.id, 'hourlyRate', parseFloat(v))}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRates.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatPounds(item.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive" 
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50">
              <tr className="border-t">
                <td colSpan={3} className="px-3 py-2 font-medium">Total</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{formatPounds(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
