
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ProgressDisplayProps } from './types';

export function ProgressDisplay({ totalEmployees, totalMapped }: ProgressDisplayProps) {
  if (totalEmployees === 0) return null;

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded flex-shrink-0">
      <div className="flex items-center justify-between text-sm">
        <span className="text-blue-800">
          Mapping Progress: {totalMapped} of {totalEmployees} total employees mapped
        </span>
        <Badge variant={totalMapped === totalEmployees ? 'default' : 'secondary'}>
          {totalMapped === totalEmployees ? 'Complete' : 'In Progress'}
        </Badge>
      </div>
    </div>
  );
}
