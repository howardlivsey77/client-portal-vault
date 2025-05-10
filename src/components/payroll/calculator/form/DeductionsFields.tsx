
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";

interface DeductionItem {
  description: string;
  amount: number;
}

interface DeductionsFieldsProps {
  deductions: DeductionItem[];
  onDeductionsChange: (deductions: DeductionItem[]) => void;
  title?: string;
}

export function DeductionsFields({ 
  deductions = [], 
  onDeductionsChange,
  title = "Additional Deductions"
}: DeductionsFieldsProps) {
  
  const addDeduction = () => {
    const newDeductions = [
      ...deductions, 
      { description: '', amount: 0 }
    ];
    onDeductionsChange(newDeductions);
  };

  const updateDeduction = (index: number, field: 'description' | 'amount', value: any) => {
    const updatedDeductions = [...deductions];
    
    if (field === 'amount') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      updatedDeductions[index] = { 
        ...updatedDeductions[index], 
        [field]: !isNaN(numValue) ? numValue : 0 
      };
    } else {
      updatedDeductions[index] = { ...updatedDeductions[index], [field]: value };
    }
    
    onDeductionsChange(updatedDeductions);
  };

  const removeDeduction = (index: number) => {
    const updatedDeductions = [...deductions];
    updatedDeductions.splice(index, 1);
    onDeductionsChange(updatedDeductions);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{title}</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addDeduction}
        >
          <PlusCircle className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      
      {deductions && deductions.length > 0 && (
        <div className="space-y-2">
          {deductions.map((deduction, index) => (
            <div key={`deduction-${index}`} className="grid grid-cols-[1fr,120px,40px] gap-2">
              <Input
                placeholder="Description"
                value={deduction.description}
                onChange={(e) => updateDeduction(index, 'description', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={deduction.amount || ''}
                onChange={(e) => updateDeduction(index, 'amount', e.target.value)}
              />
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                onClick={() => removeDeduction(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
