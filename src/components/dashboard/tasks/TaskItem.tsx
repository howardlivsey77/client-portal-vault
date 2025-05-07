
import { useState } from "react";
import { Calendar, Clock, Edit, Trash2, Repeat } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Task, TaskStatus } from "./types";
import { updateTask, deleteTask } from "./taskService";
import { toast } from "@/hooks/use-toast";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  userEmails: Record<string, string>;
}

export function TaskItem({ task, onEdit, onDelete, userEmails }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-monday-teal text-white';
      case 'medium': return 'bg-monday-yellow text-monday-darkblue';
      case 'high': return 'bg-monday-red text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-monday-gray text-white';
      case 'in_progress': return 'bg-monday-blue text-white';
      case 'done': return 'bg-monday-green text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsUpdating(true);
      await updateTask(task.id, { status: newStatus });
      toast({
        title: "Status updated",
        description: `Task status changed to ${newStatus.replace('_', ' ')}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(task.id);
        onDelete(task.id);
        toast({
          title: "Task deleted",
          description: "Task has been successfully deleted"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive"
        });
      }
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return format(new Date(dateString), 'PPP');
  };
  
  const getRecurrenceText = () => {
    if (!task.is_recurring || !task.recurrence_pattern || !task.recurrence_interval) {
      return null;
    }
    
    const interval = task.recurrence_interval;
    const pattern = task.recurrence_pattern;
    
    return `Repeats every ${interval} ${
      interval === 1 
        ? pattern === 'daily' ? 'day' 
        : pattern === 'weekly' ? 'week' 
        : 'month'
        : pattern === 'daily' ? 'days' 
        : pattern === 'weekly' ? 'weeks' 
        : 'months'
    }`;
  };
  
  return (
    <Card className="monday-card mb-4 overflow-hidden">
      <CardHeader className="monday-card-header pb-2">
        <div className="flex justify-between items-start w-full">
          <div>
            <CardTitle className="text-lg text-monday-darkblue">
              {task.title}
              {task.is_recurring && (
                <Badge variant="outline" className="ml-2 bg-gray-50">
                  <Repeat className="h-3 w-3 mr-1" />
                  Recurring
                </Badge>
              )}
            </CardTitle>
            {task.assigned_to && (
              <CardDescription className="mt-1">
                Assigned to: {userEmails[task.assigned_to] || 'Unknown user'}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <Badge className={getStatusColor(task.status)}>
              {task.status === 'in_progress' ? 'In Progress' : 
               task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="monday-card-content pt-3">
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {task.description || 'No description provided'}
        </p>
        
        <div className="flex flex-wrap items-center mt-4 text-sm text-monday-gray gap-4">
          {task.due_date && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          
          {task.is_recurring && getRecurrenceText() && (
            <div className="flex items-center">
              <Repeat className="w-4 h-4 mr-1" />
              <span>{getRecurrenceText()}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Created {format(new Date(task.created_at), 'PPP')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="monday-card-footer pt-2 flex justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              Change Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
              To Do
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('done')}>
              Done
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
            <Edit className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
