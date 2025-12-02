import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X } from 'lucide-react';
import { ExtraDeductionItem } from './types';
import { formatPounds } from '@/lib/formatters';

interface ExtraDeductionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  initialItems: ExtraDeductionItem[];
  onSave: (items: ExtraDeductionItem[]) => void;
}

export function ExtraDeductionsDialog({
  open,
  onOpenChange,
  employeeName,
  initialItems,
  onSave,
}: ExtraDeductionsDialogProps) {
  const [items, setItems] = useState<ExtraDeductionItem[]>(initialItems);

  useEffect(() => {
    if (open) {
      setItems(initialItems.length > 0 ? initialItems : [createEmptyItem()]);
    }
  }, [open, initialItems]);

  function createEmptyItem(): ExtraDeductionItem {
    return {
      id: crypto.randomUUID(),
      description: '',
      amount: 0,
    };
  }

  function updateItem(id: string, field: keyof ExtraDeductionItem, value: string | number) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  }

  function addItem() {
    setItems(prev => [...prev, createEmptyItem()]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  function handleSave() {
    const validItems = items.filter(item => item.description.trim() && item.amount > 0);
    onSave(validItems);
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Extra Deductions - {employeeName}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="text-destructive hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">
                    <Input
                      type="text"
                      placeholder="e.g. Loan repayment, Union fee"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount || ''}
                      onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-28 h-8 text-right"
                    />
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
                <td className="px-3 py-2 font-medium">Total</td>
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
