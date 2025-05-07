

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  is_recurring: boolean | null;
  recurrence_pattern: RecurrencePattern | null;
  recurrence_interval: number | null;
  last_generated_date: string | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: Date | null;
  assigned_to: string | null;
  folder_id: string | null;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  recurrence_interval: number | null;
}

