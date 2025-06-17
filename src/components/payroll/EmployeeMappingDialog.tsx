
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
import { CheckCircle, AlertCircle, Users } from "lucide-react";
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
    
    return (
      <Card key={employeeName} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {employeeName}
              <Badge variant={match.matchType === 'fuzzy' ? 'secondary' : 'destructive'} className="ml-2">
                {match.matchType === 'fuzzy' ? 'Similar Match' : 'No Match'}
              </Badge>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {match.employeeData.extraHours} hours • {match.employeeData.rateType}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {match.candidates.length > 0 && (
              <div>
                <label className="text-sm font-medium">Suggested matches:</label>
                <div className="mt-1 space-y-1">
                  {match.candidates.slice(0, 3).map(candidate => (
                    <div key={candidate.id} className="text-sm text-muted-foreground">
                      {candidate.full_name} 
                      {candidate.payroll_id && ` (${candidate.payroll_id})`}
                      <Badge variant="outline" className="ml-2">
                        {Math.round(candidate.confidence * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Select employee from database:</label>
              <Select
                value={selectedEmployeeId || 'skip'}
                onValueChange={(value) => handleMappingChange(employeeName, value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an employee or skip..." />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border shadow-lg">
                  <SelectItem value="skip">Skip this employee</SelectItem>
                  {matchingResults.allDatabaseEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                      {employee.payroll_id && ` (${employee.payroll_id})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEmployee && (
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Map Employees to Database
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 space-y-4 min-h-0">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
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
          
          {/* Progress */}
          {totalPendingCount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
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
          
          {/* Pending Matches */}
          {totalPendingCount > 0 ? (
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                <h3 className="font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Employees Requiring Manual Mapping
                </h3>
                {allPendingMatches.map(renderMatchCard)}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>All employees have been automatically matched!</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
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
