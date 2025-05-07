
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskFormData } from "./types";

export const fetchTasks = async (folderId: string | null = null): Promise<Task[]> => {
  let query = supabase.from('tasks').select('*');

  if (folderId) {
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data as Task[];
};

export const createTask = async (taskData: TaskFormData): Promise<Task> => {
  // Only include recurring task fields if the task is recurring
  const taskToCreate = {
    title: taskData.title,
    description: taskData.description,
    priority: taskData.priority,
    status: taskData.status,
    due_date: taskData.due_date ? taskData.due_date.toISOString() : null,
    assigned_to: taskData.assigned_to,
    folder_id: taskData.folder_id,
    created_by: (await supabase.auth.getUser()).data.user?.id,
    is_recurring: taskData.is_recurring,
    recurrence_pattern: taskData.is_recurring ? taskData.recurrence_pattern : null,
    recurrence_interval: taskData.is_recurring ? taskData.recurrence_interval : null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert([taskToCreate])
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return data as Task;
};

export const updateTask = async (taskId: string, taskData: Partial<TaskFormData>): Promise<Task> => {
  // Convert Date objects to ISO strings for the database
  const dataToUpdate: Record<string, any> = { ...taskData };
  
  if (taskData.due_date !== undefined) {
    dataToUpdate.due_date = taskData.due_date ? taskData.due_date.toISOString() : null;
  }
  
  // If is_recurring is set to false, clear the recurrence fields
  if (taskData.is_recurring === false) {
    dataToUpdate.recurrence_pattern = null;
    dataToUpdate.recurrence_interval = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(dataToUpdate)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return data as Task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const fetchUserProfiles = async (): Promise<{ id: string, email: string }[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email');

  if (error) {
    console.error('Error fetching user profiles:', error);
    throw error;
  }

  return data;
};

// New function to check if it's after the 6th day of the month
export const isAfterSixthOfMonth = (): boolean => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  return dayOfMonth > 6;
};

// Add a function to generate recurring tasks (this would be called by a scheduled function)
export const generateRecurringTasks = async (): Promise<void> => {
  // Only proceed if it's after the 6th of the month
  if (!isAfterSixthOfMonth()) {
    console.log("Not generating recurring tasks - before the 7th of the month");
    return;
  }
  
  // Implementation for generating recurring tasks would go here
  // This would typically be called by a scheduled function
  console.log("Generating recurring tasks - after the 6th of the month");
  
  // The actual implementation would fetch recurring tasks
  // and create new instances based on their recurrence patterns
};
