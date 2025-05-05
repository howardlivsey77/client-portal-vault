
import { useState } from "react";
import { Calendar, Clock, Edit, Trash2, CheckCircle } from "lucide-react";
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
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
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
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
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
      <CardContent className="pt-2">
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {task.description || 'No description provided'}
        </p>
        
        <div className="flex items-center mt-4 text-sm text-gray-500">
          {task.due_date && (
            <div className="flex items-center mr-4">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Created {format(new Date(task.created_at), 'PPP')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
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
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
