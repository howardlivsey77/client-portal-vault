
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useEmployees } from "@/hooks/useEmployees";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, UserPlus, UserMinus, PencilLine, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay, subMonths } from "date-fns";
import { Input } from "@/components/ui/input";

type ChangeType = 'hire' | 'termination' | 'modification';

interface EmployeeChange {
  id: string;
  employeeName: string;
  date: string;
  type: ChangeType;
  details: string;
}

export function EmployeeChangesReport() {
  const { employees, loading } = useEmployees();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Add date range filter state
  const defaultStartDate = subMonths(new Date(), 3); // Default to 3 months ago
  const defaultEndDate = new Date(); // Default to today
  
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate);
  
  // This would ideally come from an API that tracks employee changes
  // For now, we'll simulate changes based on hire dates and randomly generated modifications
  const employeeChanges: EmployeeChange[] = employees.map(employee => {
    return {
      id: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      date: employee.hire_date,
      type: 'hire',
      details: `Hired into ${employee.department} department`
    };
  });
  
  // Filter changes by date range
  const filteredChanges = employeeChanges.filter(change => {
    const changeDate = parseISO(change.date);
    
    if (startDate && endDate) {
      // Check if date is within range (inclusive)
      return !isBefore(changeDate, startOfDay(startDate)) && 
             !isAfter(changeDate, endOfDay(endDate));
    }
    
    if (startDate && !endDate) {
      // Only check start date
      return !isBefore(changeDate, startOfDay(startDate));
    }
    
    if (!startDate && endDate) {
      // Only check end date
      return !isAfter(changeDate, endOfDay(endDate));
    }
    
    // No date filters applied
    return true;
  });
  
  // Sort changes by date descending (most recent first)
  const sortedChanges = [...filteredChanges].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getChangeIcon = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'termination':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'modification':
        return <PencilLine className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getChangeBadge = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <Badge className="bg-green-500">Hire</Badge>;
      case 'termination':
        return <Badge className="bg-red-500">Termination</Badge>;
      case 'modification':
        return <Badge className="bg-blue-500">Modification</Badge>;
      default:
        return null;
    }
  };
  
  const handleResetFilters = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading report data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="monday-section-title flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Employee Changes Report
        </h2>
      </div>
      
      {/* Date Range Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="from-date">From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="from-date"
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PP") : <span>Select start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to-date">To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="to-date"
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PP") : <span>Select end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button 
          variant="outline"
          className="self-end"
          onClick={handleResetFilters}
        >
          Reset
        </Button>
      </div>
      
      <Card className="overflow-hidden border border-monday-border bg-white shadow-sm">
        <CardHeader className="bg-monday-lightest-gray border-b border-monday-border">
          <CardTitle className="text-lg font-medium text-monday-darkblue">
            Employee Changes
            {startDate && endDate && (
              <span className="text-sm font-normal text-monday-gray ml-2">
                ({format(startDate, "PP")} - {format(endDate, "PP")})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Change Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedChanges.length > 0 ? (
                sortedChanges.map((change) => (
                  <TableRow key={`${change.id}-${change.type}`}>
                    <TableCell className="font-medium">{formatDate(change.date)}</TableCell>
                    <TableCell>{change.employeeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChangeIcon(change.type)}
                        {getChangeBadge(change.type)}
                      </div>
                    </TableCell>
                    <TableCell>{change.details}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-monday-gray">
                    No employee changes found in the selected date range
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
