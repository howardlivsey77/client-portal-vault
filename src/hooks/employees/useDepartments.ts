import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks";
import { useCompany } from "@/providers";
import { 
  Department, 
  fetchDepartmentsByCompany, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  CreateDepartmentData,
  UpdateDepartmentData 
} from "@/services";

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { toast } = useToast();

  const fetchDepartments = useCallback(async (companyId?: string) => {
    const id = companyId ?? currentCompany?.id;
    console.log("useDepartments: fetchDepartments called, companyId:", id);
    
    if (!id) {
      console.log("useDepartments: No company id available, skipping fetch");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log("useDepartments: Fetching departments for company:", id);
      const data = await fetchDepartmentsByCompany(id);
      console.log("useDepartments: Received departments:", data.length, "departments");
      setDepartments(data);
    } catch (error: any) {
      console.error("useDepartments: Error fetching departments:", error);
      toast({
        title: "Error fetching departments",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addDepartment = async (departmentData: Omit<CreateDepartmentData, 'company_id'>) => {
    if (!currentCompany?.id) return;

    try {
      const newDepartment = await createDepartment({
        ...departmentData,
        company_id: currentCompany.id
      });
      
      setDepartments(prev => [...prev, newDepartment].sort((a, b) => a.name.localeCompare(b.name)));
      
      toast({
        title: "Department created",
        description: "The department has been created successfully.",
      });
      
      return newDepartment;
    } catch (error: any) {
      console.error("Error creating department:", error);
      toast({
        title: "Error creating department",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const editDepartment = async (departmentId: string, updateData: UpdateDepartmentData) => {
    try {
      const updatedDepartment = await updateDepartment(departmentId, updateData);
      
      setDepartments(prev => 
        prev.map(dept => 
          dept.id === departmentId ? updatedDepartment : dept
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      
      toast({
        title: "Department updated",
        description: "The department has been updated successfully.",
      });
      
      return updatedDepartment;
    } catch (error: any) {
      console.error("Error updating department:", error);
      toast({
        title: "Error updating department",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const removeDepartment = async (departmentId: string) => {
    try {
      await deleteDepartment(departmentId);
      
      setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
      
      toast({
        title: "Department deleted",
        description: "The department has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast({
        title: "Error deleting department",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // Get department names as array
  const departmentNames = departments.map(dept => dept.name);

  useEffect(() => {
    console.log("useDepartments: useEffect triggered, currentCompany?.id:", currentCompany?.id);
    if (currentCompany?.id) {
      fetchDepartments(currentCompany.id);
    } else {
      setLoading(false);
      setDepartments([]);
    }
  }, [currentCompany?.id, fetchDepartments]);

  return {
    departments,
    departmentNames,
    loading,
    fetchDepartments,
    addDepartment,
    editDepartment,
    removeDepartment
  };
};
