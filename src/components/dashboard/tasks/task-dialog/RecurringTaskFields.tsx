
import React from 'react';
import { Repeat } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDescription } from "@/components/ui/form";
import { RecurrencePattern } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecurringTaskFieldsProps {
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  recurrenceInterval: number | null;
  onIsRecurringChange: (value: boolean) => void;
  onRecurrencePatternChange: (value: RecurrencePattern) => void;
  onRecurrenceIntervalChange: (value: number) => void;
}

export function RecurringTaskFields({
  isRecurring,
  recurrencePattern,
  recurrenceInterval,
  onIsRecurringChange,
  onRecurrencePatternChange,
  onRecurrenceIntervalChange
}: RecurringTaskFieldsProps) {
  return (
    <div className="border-t pt-3 mt-2">
      <div className="flex items-center space-x-2 mb-3">
        <Checkbox 
          id="is_recurring"
          checked={isRecurring}
          onCheckedChange={(checked) => onIsRecurringChange(!!checked)}
        />
        <label 
          htmlFor="is_recurring" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
        >
          <Repeat className="h-4 w-4 mr-1" /> 
          Recurring Task
        </label>
      </div>
      
      {isRecurring && (
        <div className="grid grid-cols-2 gap-4 pl-6 mt-2">
          <div>
            <label htmlFor="recurrence_pattern" className="block text-sm font-medium mb-1">Repeats</label>
            <Select
              value={recurrencePattern || ""}
              onValueChange={(value) => onRecurrencePatternChange(value as RecurrencePattern)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="recurrence_interval" className="block text-sm font-medium mb-1">Every</label>
            <div className="flex items-center space-x-2">
              <Input
                id="recurrence_interval"
                type="number"
                min="1"
                value={recurrenceInterval || ""}
                onChange={(e) => onRecurrenceIntervalChange(Number(e.target.value))}
                className="w-full"
                placeholder="1"
              />
              <span className="text-sm text-muted-foreground w-24">
                {recurrencePattern === "daily" ? "day(s)" : 
                 recurrencePattern === "weekly" ? "week(s)" : 
                 recurrencePattern === "monthly" ? "month(s)" : ""}
              </span>
            </div>
          </div>
          
          <div className="col-span-2 mt-1">
            <FormDescription className="text-xs">
              {recurrencePattern && recurrenceInterval ? (
                <>
                  This task will repeat every {recurrenceInterval} {' '}
                  {recurrenceInterval === 1 
                    ? recurrencePattern === 'daily' ? 'day' 
                      : recurrencePattern === 'weekly' ? 'week' 
                      : 'month'
                    : recurrencePattern === 'daily' ? 'days' 
                      : recurrencePattern === 'weekly' ? 'weeks' 
                      : 'months'
                  }.
                </>
              ) : 'Specify how often this task should repeat.'}
            </FormDescription>
          </div>
        </div>
      )}
    </div>
  );
}
