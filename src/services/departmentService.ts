
import { supabase } from "@/integrations/supabase/client";

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  company_id: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Fetch all departments for a company
 */
export const fetchDepartmentsByCompany = async (companyId: string): Promise<Department[]> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching departments:", error);
    throw new Error(`Failed to fetch departments: ${error.message}`);
  }

  return data || [];
};

/**
 * Create a new department
 */
export const createDepartment = async (departmentData: CreateDepartmentData): Promise<Department> => {
  const { data, error } = await supabase
    .from('departments')
    .insert([departmentData])
    .select()
    .single();

  if (error) {
    console.error("Error creating department:", error);
    throw new Error(`Failed to create department: ${error.message}`);
  }

  return data;
};

/**
 * Update a department
 */
export const updateDepartment = async (departmentId: string, updateData: UpdateDepartmentData): Promise<Department> => {
  const { data, error } = await supabase
    .from('departments')
    .update(updateData)
    .eq('id', departmentId)
    .select()
    .single();

  if (error) {
    console.error("Error updating department:", error);
    throw new Error(`Failed to update department: ${error.message}`);
  }

  return data;
};

/**
 * Delete a department (soft delete by setting is_active to false)
 */
export const deleteDepartment = async (departmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('departments')
    .update({ is_active: false })
    .eq('id', departmentId);

  if (error) {
    console.error("Error deleting department:", error);
    throw new Error(`Failed to delete department: ${error.message}`);
  }
};

/**
 * Get department names as string array for a company
 */
export const getDepartmentNames = async (companyId: string): Promise<string[]> => {
  const departments = await fetchDepartmentsByCompany(companyId);
  return departments.map(dept => dept.name);
};
