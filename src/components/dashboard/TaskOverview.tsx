
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "./tasks/taskService";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export function TaskOverview() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchTasks(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
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

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle>Task Summary</CardTitle>
          <CardDescription>Overview of your tasks</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium">Total Tasks</div>
            <div className="font-bold">{summary.total}</div>
          </div>
          
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center">
              <CheckSquare className="mr-2 h-4 w-4 text-green-500" />
              <div className="text-sm font-medium">Completed</div>
            </div>
            <div className="font-bold">{summary.completed}</div>
          </div>
          
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-blue-500" />
              <div className="text-sm font-medium">In Progress</div>
            </div>
            <div className="font-bold">{summary.inProgress}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
              <div className="text-sm font-medium">Overdue</div>
            </div>
            <div className="font-bold">{summary.overdue}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
