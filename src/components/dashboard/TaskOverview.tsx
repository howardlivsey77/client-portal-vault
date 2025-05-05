
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "./tasks/taskService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export function TaskOverview() {
  const navigate = useNavigate();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchTasks(),
  });

  if (isLoading) {
    return (
      <Card className="monday-tile">
        <CardHeader className="monday-card-header">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="monday-card-content">
          <div className="grid gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate task statistics
  const summary: TaskSummary = tasks ? tasks.reduce((acc: TaskSummary, task) => {
    acc.total++;
    
    if (task.status === 'done') {
      acc.completed++;
    } else if (task.status === 'in_progress') {
      acc.inProgress++;
    }
    
    // Check for overdue tasks (due date is in the past and not completed)
    if (task.due_date && task.status !== 'done') {
      const dueDate = new Date(task.due_date);
      if (dueDate < new Date()) {
        acc.overdue++;
      }
    }
    
    return acc;
  }, { total: 0, completed: 0, inProgress: 0, overdue: 0 }) : 
  { total: 0, completed: 0, inProgress: 0, overdue: 0 };

  const handleViewAllTasks = () => {
    navigate("/?tab=tasks");
  };

  return (
    <Card className="monday-tile">
      <CardHeader className="monday-card-header">
        <div className="space-y-0.5">
          <CardTitle className="text-xl font-bold text-monday-darkblue">Task Summary</CardTitle>
          <CardDescription>Overview of your tasks</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="monday-card-content">
        <div className="grid gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium text-monday-darkblue">Total Tasks</div>
            <div className="font-bold text-monday-darkblue">{summary.total}</div>
          </div>
          
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center">
              <CheckSquare className="mr-2 h-4 w-4 text-monday-green" />
              <div className="text-sm font-medium">Completed</div>
            </div>
            <div className="font-bold text-monday-green">{summary.completed}</div>
          </div>
          
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-monday-blue" />
              <div className="text-sm font-medium">In Progress</div>
            </div>
            <div className="font-bold text-monday-blue">{summary.inProgress}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-monday-yellow" />
              <div className="text-sm font-medium">Overdue</div>
            </div>
            <div className="font-bold text-monday-yellow">{summary.overdue}</div>
          </div>
          
          <Button onClick={handleViewAllTasks} variant="default" className="mt-2 w-full">
            View All Tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
