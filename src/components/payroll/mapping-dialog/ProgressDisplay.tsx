
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ProgressDisplayProps } from './types';
import { useBrandColors } from "@/brand";

export function ProgressDisplay({ totalEmployees, totalMapped }: ProgressDisplayProps) {
  const brandColors = useBrandColors();
  
  if (totalEmployees === 0) return null;

  return (
    <div 
      className="p-3 border rounded flex-shrink-0"
      style={{ 
        backgroundColor: `hsl(${brandColors.infoLight})`,
        borderColor: `hsl(${brandColors.info} / 0.3)`
      }}
    >
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: `hsl(${brandColors.info})` }}>
          Mapping Progress: {totalMapped} of {totalEmployees} total employees mapped
        </span>
        <Badge variant={totalMapped === totalEmployees ? 'default' : 'secondary'}>
          {totalMapped === totalEmployees ? 'Complete' : 'In Progress'}
        </Badge>
      </div>
    </div>
  );
}
