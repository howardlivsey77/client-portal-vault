
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { EmployeeCardProps } from './types';
import { useBrandColors } from "@/brand";

export function EmployeeCard({
  match,
  userMappings,
  allDatabaseEmployees,
  expandedCards,
  onMappingChange,
  onToggleExpansion
}: EmployeeCardProps) {
  const brandColors = useBrandColors();
  const employeeName = match.employeeData.employeeName;
  const selectedEmployeeId = userMappings[employeeName];
  const selectedEmployee = selectedEmployeeId 
    ? allDatabaseEmployees.find(emp => emp.id === selectedEmployeeId)
    : null;
  
  const isExpanded = expandedCards[employeeName];
  const hasMultipleCandidates = match.candidates.length > 1;
  const displayCandidates = isExpanded ? match.candidates : match.candidates.slice(0, 2);
  
  const sortedEmployees = [...allDatabaseEmployees].sort((a, b) => {
    if (a.last_name !== b.last_name) {
      return a.last_name.localeCompare(b.last_name);
    }
    return a.first_name.localeCompare(b.first_name);
  });

  return (
    <Card className="mb-3 bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {employeeName}
            <Badge variant={match.matchType === 'fuzzy' ? 'secondary' : 'destructive'} className="ml-2 text-xs">
              {match.matchType === 'fuzzy' ? 'Similar Match' : 'No Match'}
            </Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {match.employeeData.extraHours}h • {match.employeeData.rateType}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {match.candidates.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Suggested matches:</label>
                {hasMultipleCandidates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onToggleExpansion(employeeName)}
                  >
                    {isExpanded ? (
                      <>Show less <ChevronUp className="ml-1 h-3 w-3" /></>
                    ) : (
                      <>Show more <ChevronDown className="ml-1 h-3 w-3" /></>
                    )}
                  </Button>
                )}
              </div>
              <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                {displayCandidates.map(candidate => (
                  <div key={candidate.id} className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      {candidate.full_name} 
                      {candidate.payroll_id && ` (${candidate.payroll_id})`}
                    </span>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {Math.round(candidate.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="text-xs font-medium">Select employee:</label>
            <Select
              value={selectedEmployeeId || 'skip'}
              onValueChange={(value) => onMappingChange(employeeName, value)}
            >
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue placeholder="Choose or skip..." />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border shadow-lg max-h-48">
                <SelectItem value="skip" className="text-xs">Skip this employee</SelectItem>
                {sortedEmployees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id} className="text-xs">
                    {employee.full_name}
                    {employee.payroll_id && ` (${employee.payroll_id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedEmployee && (
            <div 
              className="p-2 border rounded text-xs"
              style={{
                backgroundColor: `hsl(${brandColors.successLight})`,
                borderColor: `hsl(${brandColors.success} / 0.3)`
              }}
            >
              <div className="flex items-center" style={{ color: `hsl(${brandColors.success})` }}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Mapped to: {selectedEmployee.full_name}
                {selectedEmployee.payroll_id && ` (${selectedEmployee.payroll_id})`}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
