
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, TableIcon } from "lucide-react";

interface EmptySchemesStateProps {
  onAddScheme: () => void;
}

export const EmptySchemesState = ({ onAddScheme }: EmptySchemesStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
      <TableIcon className="h-12 w-12 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">No schemes defined</h3>
      <p className="text-muted-foreground text-sm mb-4">Create your first sickness scheme</p>
      <Button onClick={onAddScheme}>
        <Plus className="h-4 w-4 mr-2" />
        Add Scheme
      </Button>
    </div>
  );
};
