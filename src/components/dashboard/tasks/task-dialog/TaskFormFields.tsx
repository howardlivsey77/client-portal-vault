
import React from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskPriority, TaskStatus } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFormFieldsProps {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  assignedTo: string | null;
  users: { id: string, email: string }[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority) => void;
  onStatusChange: (value: TaskStatus) => void;
  onDueDateChange: (date: Date | null) => void;
  onAssignedToChange: (value: string | null) => void;
}

export function TaskFormFields({
  title,
  description,
  priority,
  status,
  dueDate,
  assignedTo,
  users,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onStatusChange,
  onDueDateChange,
  onAssignedToChange
}: TaskFormFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Task title"
          className="w-full"
          autoFocus
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Task description"
          className="w-full"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
          <Select
            value={priority}
            onValueChange={(value) => onPriorityChange(value as TaskPriority)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
          <Select
            value={status}
            onValueChange={(value) => onStatusChange(value as TaskStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate || undefined}
                onSelect={onDueDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium mb-1">Assigned To</label>
          <Select
            value={assignedTo || "unassigned"}
            onValueChange={(value) => onAssignedToChange(value === "unassigned" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}
