
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Task, TaskFormData, TaskPriority, TaskStatus, RecurrencePattern } from "./types";
import { createTask, updateTask, fetchUserProfiles } from "./taskService";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";

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
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update task details and assignment"
              : "Add a new task with details and assignment"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Task title"
              className="w-full"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Task description"
              className="w-full"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value as TaskPriority)}
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
                value={formData.status}
                onValueChange={(value) => handleChange("status", value as TaskStatus)}
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
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date || undefined}
                    onSelect={(date) => handleChange("due_date", date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium mb-1">Assigned To</label>
              <Select
                value={formData.assigned_to || "unassigned"}
                onValueChange={(value) => handleChange("assigned_to", value === "unassigned" ? null : value)}
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
          
          {/* Recurring Task Section */}
          <div className="border-t pt-3 mt-2">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => handleChange("is_recurring", !!checked)}
              />
              <label 
                htmlFor="is_recurring" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <Repeat className="h-4 w-4 mr-1" /> 
                Recurring Task
              </label>
            </div>
            
            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-4 pl-6 mt-2">
                <div>
                  <label htmlFor="recurrence_pattern" className="block text-sm font-medium mb-1">Repeats</label>
                  <Select
                    value={formData.recurrence_pattern || ""}
                    onValueChange={(value) => handleChange("recurrence_pattern", value as RecurrencePattern)}
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
                      value={formData.recurrence_interval || ""}
                      onChange={(e) => handleChange("recurrence_interval", Number(e.target.value))}
                      className="w-full"
                      placeholder="1"
                    />
                    <span className="text-sm text-muted-foreground w-24">
                      {formData.recurrence_pattern === "daily" ? "day(s)" : 
                       formData.recurrence_pattern === "weekly" ? "week(s)" : 
                       formData.recurrence_pattern === "monthly" ? "month(s)" : ""}
                    </span>
                  </div>
                </div>
                
                <div className="col-span-2 mt-1">
                  <FormDescription className="text-xs">
                    {formData.recurrence_pattern && formData.recurrence_interval ? (
                      <>
                        This task will repeat every {formData.recurrence_interval} {' '}
                        {formData.recurrence_interval === 1 
                          ? formData.recurrence_pattern === 'daily' ? 'day' 
                            : formData.recurrence_pattern === 'weekly' ? 'week' 
                            : 'month'
                          : formData.recurrence_pattern === 'daily' ? 'days' 
                            : formData.recurrence_pattern === 'weekly' ? 'weeks' 
                            : 'months'
                        }.
                      </>
                    ) : 'Specify how often this task should repeat.'}
                  </FormDescription>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
