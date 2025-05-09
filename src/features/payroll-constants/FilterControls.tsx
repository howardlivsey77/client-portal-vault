
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Filter } from "lucide-react";

interface FilterControlsProps {
  showHistorical: boolean;
  setShowHistorical: (value: boolean) => void;
}

export function FilterControls({ showHistorical, setShowHistorical }: FilterControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch 
        id="show-historical" 
        checked={showHistorical} 
        onCheckedChange={setShowHistorical}
      />
      <label htmlFor="show-historical" className="text-sm cursor-pointer flex items-center gap-1">
        <Filter className="h-4 w-4" /> Show historical records
      </label>
    </div>
  );
}
