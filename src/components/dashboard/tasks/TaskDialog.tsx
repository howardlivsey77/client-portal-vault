
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "@/hooks";
import { Task, TaskFormData, TaskPriority, TaskStatus, RecurrencePattern } from "./types";
import { createTask, updateTask, fetchUserProfiles } from "./taskService";
import { TaskFormFields } from "./task-dialog/TaskFormFields";
import { RecurringTaskFields } from "./task-dialog/RecurringTaskFields";
import { TaskDialogHeader } from "./task-dialog/TaskDialogHeader";
import { TaskDialogFooter } from "./task-dialog/TaskDialogFooter";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskSaved: () => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onTaskSaved
}: TaskDialogProps) {
  const isEditing = !!task;
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    due_date: null,
    assigned_to: null,
    folder_id: null,
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_interval: null
  });
  
  const [users, setUsers] = useState<{id: string, email: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode - populate form with task data
        setFormData({
          title: task.title,
          description: task.description || "",
          priority: task.priority as TaskPriority,
          status: task.status as TaskStatus,
          due_date: task.due_date ? new Date(task.due_date) : null,
          assigned_to: task.assigned_to,
          folder_id: task.folder_id,
          is_recurring: task.is_recurring || false,
          recurrence_pattern: task.recurrence_pattern as RecurrencePattern | null,
          recurrence_interval: task.recurrence_interval || null
        });
      } else {
        // Create mode - reset form
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          status: "todo",
          due_date: null,
          assigned_to: null,
          folder_id: null,
          is_recurring: false,
          recurrence_pattern: null,
          recurrence_interval: null
        });
      }
      
      // Fetch users for assignment
      fetchUserProfiles()
        .then(data => setUsers(data))
        .catch(err => console.error("Failed to load users", err));
    }
  }, [open, task]);
  
  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // If turning off recurring, reset the recurrence fields
    if (field === 'is_recurring' && value === false) {
      setFormData(prev => ({
        ...prev,
        recurrence_pattern: null,
        recurrence_interval: null
      }));
    }
  };
  
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive"
      });
      return;
    }
    
    // Validate recurring task fields
    if (formData.is_recurring) {
      if (!formData.recurrence_pattern) {
        toast({
          title: "Error",
          description: "Please select how often the task should repeat",
          variant: "destructive"
        });
        return;
      }
      
      if (!formData.recurrence_interval || formData.recurrence_interval < 1) {
        toast({
          title: "Error",
          description: "Please enter a valid recurrence interval",
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      if (isEditing && task) {
        await updateTask(task.id, formData);
        toast({
          title: "Task updated",
          description: "Task has been successfully updated"
        });
      } else {
        await createTask(formData);
        toast({
          title: "Task created",
          description: "New task has been created"
        });
      }
      
      onTaskSaved();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive"
      });
      console.error("Error saving task:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <TaskDialogHeader isEditing={isEditing} />
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <TaskFormFields
            title={formData.title}
            description={formData.description}
            priority={formData.priority}
            status={formData.status}
            dueDate={formData.due_date}
            assignedTo={formData.assigned_to}
            users={users}
            onTitleChange={(value) => handleChange("title", value)}
            onDescriptionChange={(value) => handleChange("description", value)}
            onPriorityChange={(value) => handleChange("priority", value)}
            onStatusChange={(value) => handleChange("status", value)}
            onDueDateChange={(date) => handleChange("due_date", date)}
            onAssignedToChange={(value) => handleChange("assigned_to", value)}
          />
          
          <RecurringTaskFields
            isRecurring={formData.is_recurring}
            recurrencePattern={formData.recurrence_pattern}
            recurrenceInterval={formData.recurrence_interval}
            onIsRecurringChange={(value) => handleChange("is_recurring", value)}
            onRecurrencePatternChange={(value) => handleChange("recurrence_pattern", value)}
            onRecurrenceIntervalChange={(value) => handleChange("recurrence_interval", value)}
          />
        </div>
        
        <DialogFooter>
          <TaskDialogFooter 
            isLoading={isLoading}
            isEditing={isEditing}
            onSave={handleSave}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
