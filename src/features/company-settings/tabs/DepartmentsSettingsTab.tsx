
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { toast } from "sonner";

const DepartmentsSettingsTab = () => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  
  // Load departments from localStorage on component mount
  useEffect(() => {
    const savedDepartments = localStorage.getItem("companyDepartments");
    if (savedDepartments) {
      setDepartments(JSON.parse(savedDepartments));
    }
  }, []);

  // Save departments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("companyDepartments", JSON.stringify(departments));
  }, [departments]);

  // Add new department
  const handleAddDepartment = () => {
    if (newDepartment.trim() === "") return;
    
    if (!departments.includes(newDepartment.trim())) {
      const updatedDepartments = [...departments, newDepartment.trim()];
      // Sort departments alphabetically
      updatedDepartments.sort((a, b) => a.localeCompare(b));
      setDepartments(updatedDepartments);
      setNewDepartment("");
      toast.success("Department added successfully");
    } else {
      toast.error("Department already exists");
    }
  };

  // Remove department
  const handleRemoveDepartment = (departmentToRemove: string) => {
    setDepartments(departments.filter(dept => dept !== departmentToRemove));
    toast.success("Department removed successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments</CardTitle>
        <CardDescription>
          Manage company departments and divisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <FormLabel htmlFor="department-input">Add Department</FormLabel>
            <Input
              id="department-input"
              placeholder="Enter department name"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleAddDepartment}
            type="button"
          >
            Add
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Department List</h3>
          
          {departments.length === 0 ? (
            <p className="text-muted-foreground">No departments added yet. Add your first department above.</p>
          ) : (
            <div className="space-y-2">
              {departments.map((dept, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <span>{dept}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveDepartment(dept)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentsSettingsTab;
