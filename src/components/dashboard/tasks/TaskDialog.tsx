
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
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Task, TaskFormData, TaskPriority, TaskStatus } from "./types";
import { createTask, updateTask, fetchUserProfiles } from "./taskService";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  folderId: string | null;
  onTaskSaved: () => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  folderId,
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
    folder_id: folderId
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
          folder_id: task.folder_id || folderId
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
          folder_id: folderId
        });
      }
      
      // Fetch users for assignment
      fetchUserProfiles()
        .then(data => setUsers(data))
        .catch(err => console.error("Failed to load users", err));
    }
  }, [open, task, folderId]);
  
  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium mb-1">Assigned To</label>
              <Select
                value={formData.assigned_to || ""}
                onValueChange={(value) => handleChange("assigned_to", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
