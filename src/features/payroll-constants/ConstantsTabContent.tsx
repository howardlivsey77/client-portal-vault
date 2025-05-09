
import React from "react";
import { Button } from "@/components/ui/button";
import { FilterControls } from "./FilterControls";
import { PayrollConstantsTable } from "./PayrollConstantsTable";
import { PayrollConstantForm } from "./PayrollConstantForm";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConstantsTabContentProps {
  loading: boolean;
  showForm: boolean;
  editingConstant: TaxConstant | null;
  constants: TaxConstant[];
  activeCategory: string;
  showHistorical: boolean;
  setShowHistorical: (show: boolean) => void;
  onAddNew: () => void;
  onEdit: (constant: TaxConstant) => void;
  onDelete: (constant: TaxConstant) => void;
  onSave: (constant: Partial<TaxConstant>) => Promise<void>;
  onCancelForm: () => void;
}

export function ConstantsTabContent({
  loading,
  showForm,
  editingConstant,
  constants,
  activeCategory,
  showHistorical,
  setShowHistorical,
  onAddNew,
  onEdit,
  onDelete,
  onSave,
  onCancelForm
}: ConstantsTabContentProps) {
  if (showForm) {
    return (
      <PayrollConstantForm 
        constant={editingConstant}
        category={activeCategory}
        onSave={onSave}
        onCancel={onCancelForm}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <FilterControls 
          showHistorical={showHistorical} 
          setShowHistorical={setShowHistorical} 
        />
        <Button onClick={onAddNew}>Add New Constant</Button>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="flex-1 pr-4">
          <PayrollConstantsTable 
            constants={constants} 
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </ScrollArea>
      )}
    </div>
  );
}
