
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
        ...taskData,
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
  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
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
