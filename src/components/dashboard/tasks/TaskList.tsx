
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./TaskItem";
import { TaskDialog } from "./TaskDialog";
import { Task } from "./types";
import { fetchTasks, fetchUserProfiles } from "./taskService";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskList() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  
  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchTasks(),
  });
  
  // Fetch user profiles for assignment display
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await fetchUserProfiles();
        const emailMap: Record<string, string> = {};
        users.forEach(user => {
          emailMap[user.id] = user.email;
        });
        setUserEmails(emailMap);
      } catch (error) {
        console.error("Failed to load user profiles", error);
      }
    };
    
    loadUsers();
  }, []);
  
  const handleAddTask = () => {
    setSelectedTask(null);
    setIsDialogOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };
  
  const handleDeleteTask = (taskId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };
  
  const handleTaskSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <Skeleton className="h-9 w-28" />
        </div>
        {[1, 2, 3].map((index) => (
          <Skeleton key={index} className="w-full h-40" />
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-xl font-semibold mb-2">Error Loading Tasks</h2>
        <p className="text-gray-500">There was an error loading tasks. Please try again.</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
        >
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button onClick={handleAddTask}>
          <Plus className="mr-1 h-4 w-4" /> Add Task
        </Button>
      </div>
      
      {tasks && tasks.length > 0 ? (
        <div>
          {tasks.map((task) => (
            <TaskItem 
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              userEmails={userEmails}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-4">Create a new task to get started</p>
          <Button onClick={handleAddTask}>
            <Plus className="mr-1 h-4 w-4" /> Add Task
          </Button>
        </div>
      )}
      
      <TaskDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={selectedTask}
        folderId={null}
        onTaskSaved={handleTaskSaved}
      />
    </div>
  );
}
