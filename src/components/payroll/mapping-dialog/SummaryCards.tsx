
import React from 'react';
import { SummaryCardsProps } from './types';

export function SummaryCards({ exactMatches, fuzzyMatches, unmatchedEmployees }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 flex-shrink-0">
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{exactMatches}</div>
        <div className="text-sm text-green-800">Exact Matches</div>
      </div>
      <div className="text-center p-3 bg-yellow-50 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">{fuzzyMatches}</div>
        <div className="text-sm text-yellow-800">Similar Matches</div>
      </div>
      <div className="text-center p-3 bg-red-50 rounded-lg">
        <div className="text-2xl font-bold text-red-600">{unmatchedEmployees}</div>
        <div className="text-sm text-red-800">Unmatched</div>
      </div>
    </div>
  );
}
