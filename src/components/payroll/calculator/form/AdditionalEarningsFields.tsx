
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";

interface EarningItem {
  description: string;
  amount: number;
}

interface AdditionalEarningsFieldsProps {
  additionalEarnings: EarningItem[];
  onEarningsChange: (earnings: EarningItem[]) => void;
}

export function AdditionalEarningsFields({ 
  additionalEarnings, 
  onEarningsChange 
}: AdditionalEarningsFieldsProps) {
  
  const addEarning = () => {
    const newEarnings = [
      ...additionalEarnings, 
      { description: '', amount: 0 }
    ];
    onEarningsChange(newEarnings);
  };

  const updateEarning = (index: number, field: 'description' | 'amount', value: any) => {
    const updatedEarnings = [...additionalEarnings];
    
    if (field === 'amount') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      updatedEarnings[index] = { 
        ...updatedEarnings[index], 
        [field]: !isNaN(numValue) ? numValue : 0 
      };
    } else {
      updatedEarnings[index] = { ...updatedEarnings[index], [field]: value };
    }
    
    onEarningsChange(updatedEarnings);
  };

  const removeEarning = (index: number) => {
    const updatedEarnings = [...additionalEarnings];
    updatedEarnings.splice(index, 1);
    onEarningsChange(updatedEarnings);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Additional Earnings</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addEarning}
        >
          <PlusCircle className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      
      {additionalEarnings && additionalEarnings.length > 0 && (
        <div className="space-y-2">
          {additionalEarnings.map((earning, index) => (
            <div key={`earning-${index}`} className="grid grid-cols-[1fr,120px,40px] gap-2">
              <Input
                placeholder="Description (e.g., Overtime)"
                value={earning.description}
                onChange={(e) => updateEarning(index, 'description', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={earning.amount || ''}
                onChange={(e) => updateEarning(index, 'amount', e.target.value)}
              />
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                onClick={() => removeEarning(index)}
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
