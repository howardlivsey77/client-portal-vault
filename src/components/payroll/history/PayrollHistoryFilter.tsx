
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PayrollHistoryFilterProps {
  onFilterChange: (filters: PayrollHistoryFilters) => void;
}

export interface PayrollHistoryFilters {
  employeeName?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function PayrollHistoryFilter({ onFilterChange }: PayrollHistoryFilterProps) {
  const [employeeName, setEmployeeName] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  const handleEmployeeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmployeeName(value);
    onFilterChange({ employeeName: value || undefined, dateFrom, dateTo });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFilterChange({ employeeName: employeeName || undefined, dateFrom: date, dateTo });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFilterChange({ employeeName: employeeName || undefined, dateFrom, dateTo: date });
  };

  const clearFilters = () => {
    setEmployeeName("");
    setDateFrom(undefined);
    setDateTo(undefined);
    onFilterChange({});
  };

  const hasActiveFilters = !!(employeeName || dateFrom || dateTo);

  return (
    <div className="flex flex-col space-y-4 mb-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-end">
      <div className="flex-1">
        <div className="relative">
          <Input
            placeholder="Filter by employee name"
            value={employeeName}
            onChange={handleEmployeeNameChange}
            className="pl-9"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex-initial">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={handleDateFromChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex-initial">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={handleDateToChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              disabled={(date) => dateFrom ? date < dateFrom : false}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="flex-initial">
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
