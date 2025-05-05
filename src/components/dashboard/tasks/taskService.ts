
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
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date ? taskData.due_date.toISOString() : null,
        assigned_to: taskData.assigned_to,
        folder_id: taskData.folder_id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }
    ])
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
  const dataToUpdate = {
    ...taskData,
    due_date: taskData.due_date ? taskData.due_date.toISOString() : undefined
  };

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
