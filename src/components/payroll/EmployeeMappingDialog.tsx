
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, Users } from "lucide-react";
import { EmployeeMatchingResults } from '@/services/payroll/employeeMatching';
import { SummaryCards } from './mapping-dialog/SummaryCards';
import { ProgressDisplay } from './mapping-dialog/ProgressDisplay';
import { EmployeeCard } from './mapping-dialog/EmployeeCard';
import { EmployeeMappingDialogProps } from './mapping-dialog/types';

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
    
    console.log('Initial mappings:', initialMappings);
    setUserMappings(initialMappings);
  }, [matchingResults]);
  
  const handleMappingChange = (employeeName: string, employeeId: string) => {
    setUserMappings(prev => {
      const newMappings = { ...prev };
      if (employeeId === 'skip') {
        delete newMappings[employeeName];
      } else {
        newMappings[employeeName] = employeeId;
      }
      console.log('Updated mappings:', newMappings);
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
    // Don't close the main dialog here - let the parent handle the flow
  };
  
  const handleCancel = () => {
    onCancel();
    // Don't close the main dialog here - let the parent handle the flow
  };
  
  const allPendingMatches = [...matchingResults.fuzzyMatches, ...matchingResults.unmatchedEmployees];
  const totalEmployees = matchingResults.exactMatches.length + matchingResults.fuzzyMatches.length + matchingResults.unmatchedEmployees.length;
  
  // Calculate total mapped correctly - count ALL resolved employees
  const exactMatchesCount = matchingResults.exactMatches.length;
  
  // For fuzzy matches: count those that are resolved (either have userMapping OR are auto-resolved with high confidence)
  const resolvedFuzzyMatches = matchingResults.fuzzyMatches.filter(match => {
    const employeeName = match.employeeData.employeeName;
    // Has user mapping OR was auto-resolved (has high confidence candidates)
    return userMappings.hasOwnProperty(employeeName) || 
           (match.candidates.length > 0 && match.candidates[0].confidence > 0.8);
  }).length;
  
  // For unmatched employees: count those that have been manually mapped
  const resolvedUnmatchedEmployees = matchingResults.unmatchedEmployees.filter(match =>
    userMappings.hasOwnProperty(match.employeeData.employeeName)
  ).length;
  
  // Total mapped = exact matches + resolved fuzzy matches + resolved unmatched employees
  const totalMapped = exactMatchesCount + resolvedFuzzyMatches + resolvedUnmatchedEmployees;
  
  // Enhanced debug logging
  console.log('Progress calculation:', {
    exactMatchesCount,
    resolvedFuzzyMatches,
    resolvedUnmatchedEmployees,
    totalEmployees,
    totalMapped,
    userMappings,
    userMappingsCount: Object.keys(userMappings).length,
    fuzzyMatchDetails: matchingResults.fuzzyMatches.map(match => ({
      name: match.employeeData.employeeName,
      hasUserMapping: userMappings.hasOwnProperty(match.employeeData.employeeName),
      hasHighConfidenceCandidate: match.candidates.length > 0 && match.candidates[0].confidence > 0.8,
      topConfidence: match.candidates.length > 0 ? match.candidates[0].confidence : 0
    })),
    unmatchedDetails: matchingResults.unmatchedEmployees.map(match => ({
      name: match.employeeData.employeeName,
      hasUserMapping: userMappings.hasOwnProperty(match.employeeData.employeeName)
    }))
  });
  
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
          <SummaryCards
            exactMatches={matchingResults.exactMatches.length}
            fuzzyMatches={matchingResults.fuzzyMatches.length}
            unmatchedEmployees={matchingResults.unmatchedEmployees.length}
          />
          
          <ProgressDisplay 
            totalEmployees={totalEmployees}
            totalMapped={totalMapped}
          />
          
          {allPendingMatches.length > 0 ? (
            <div className="flex-1 min-h-0">
              <h3 className="font-medium flex items-center mb-3 flex-shrink-0">
                <AlertCircle className="h-4 w-4 mr-2" />
                Employees Requiring Manual Mapping
              </h3>
              <ScrollArea className="h-full pr-2">
                <div className="space-y-2">
                  {allPendingMatches.map(match => (
                    <EmployeeCard
                      key={match.employeeData.employeeName}
                      match={match}
                      userMappings={userMappings}
                      allDatabaseEmployees={matchingResults.allDatabaseEmployees}
                      expandedCards={expandedCards}
                      onMappingChange={handleMappingChange}
                      onToggleExpansion={toggleCardExpansion}
                    />
                  ))}
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
            Continue with {totalMapped} employees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
