
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, Users, ChevronDown, ChevronUp } from "lucide-react";
import { EmployeeMatchingResults, EmployeeMatchResult, EmployeeMatchCandidate } from '@/services/payroll/employeeMatching';

interface EmployeeMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchingResults: EmployeeMatchingResults;
  onConfirm: (mappings: Record<string, string>) => void;
  onCancel: () => void;
}

export function EmployeeMappingDialog({
  open,
  onOpenChange,
  matchingResults,
  onConfirm,
  onCancel
}: EmployeeMappingDialogProps) {
  const [userMappings, setUserMappings] = useState<Record<string, string>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  // Initialize with best fuzzy matches
  React.useEffect(() => {
    const initialMappings: Record<string, string> = {};
    
    matchingResults.fuzzyMatches.forEach(match => {
      if (match.candidates.length > 0 && match.candidates[0].confidence > 0.8) {
        initialMappings[match.employeeData.employeeName] = match.candidates[0].id;
      }
    });
    
    setUserMappings(initialMappings);
  }, [matchingResults]);
  
  const handleMappingChange = (employeeName: string, employeeId: string) => {
    setUserMappings(prev => {
      const newMappings = { ...prev };
      if (employeeId === 'skip') {
        // Remove the mapping if user chooses to skip
        delete newMappings[employeeName];
      } else {
        newMappings[employeeName] = employeeId;
      }
      return newMappings;
    });
  };
  
  const toggleCardExpansion = (employeeName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [employeeName]: !prev[employeeName]
    }));
  };
  
  const handleConfirm = () => {
    onConfirm(userMappings);
    onOpenChange(false);
  };
  
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };
  
  const allPendingMatches = [...matchingResults.fuzzyMatches, ...matchingResults.unmatchedEmployees];
  const mappedCount = Object.keys(userMappings).length;
  const totalPendingCount = allPendingMatches.length;
  
  const renderMatchCard = (match: EmployeeMatchResult) => {
    const employeeName = match.employeeData.employeeName;
    const selectedEmployeeId = userMappings[employeeName];
    const selectedEmployee = selectedEmployeeId 
      ? matchingResults.allDatabaseEmployees.find(emp => emp.id === selectedEmployeeId)
      : null;
    
    const isExpanded = expandedCards[employeeName];
    const hasMultipleCandidates = match.candidates.length > 1;
    const displayCandidates = isExpanded ? match.candidates : match.candidates.slice(0, 2);
    
    return (
      <Card key={employeeName} className="mb-3">
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
                      onClick={() => toggleCardExpansion(employeeName)}
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
                onValueChange={(value) => handleMappingChange(employeeName, value)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Choose or skip..." />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border shadow-lg max-h-48">
                  <SelectItem value="skip" className="text-xs">Skip this employee</SelectItem>
                  {matchingResults.allDatabaseEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id} className="text-xs">
                      {employee.full_name}
                      {employee.payroll_id && ` (${employee.payroll_id})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEmployee && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                <div className="flex items-center text-green-800">
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
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Map Employees to Database
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Summary - Fixed height */}
          <div className="grid grid-cols-3 gap-4 flex-shrink-0">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{matchingResults.exactMatches.length}</div>
              <div className="text-sm text-green-800">Exact Matches</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{matchingResults.fuzzyMatches.length}</div>
              <div className="text-sm text-yellow-800">Similar Matches</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{matchingResults.unmatchedEmployees.length}</div>
              <div className="text-sm text-red-800">Unmatched</div>
            </div>
          </div>
          
          {/* Progress - Fixed height */}
          {totalPendingCount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-800">
                  Mapping Progress: {mappedCount} of {totalPendingCount} employees mapped
                </span>
                <Badge variant={mappedCount === totalPendingCount ? 'default' : 'secondary'}>
                  {mappedCount === totalPendingCount ? 'Complete' : 'In Progress'}
                </Badge>
              </div>
            </div>
          )}
          
          {/* Scrollable Content Area */}
          {totalPendingCount > 0 ? (
            <div className="flex-1 min-h-0">
              <h3 className="font-medium flex items-center mb-3 flex-shrink-0">
                <AlertCircle className="h-4 w-4 mr-2" />
                Employees Requiring Manual Mapping
              </h3>
              <ScrollArea className="h-full pr-2">
                <div className="space-y-2">
                  {allPendingMatches.map(renderMatchCard)}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>All employees have been automatically matched!</p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Continue with {matchingResults.exactMatches.length + mappedCount} employees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
