
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  hire_date: string;
  salary: number;
  phone_number: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

const EmployeeDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);
  
  const fetchEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) throw error;
      
      setEmployee(data as Employee);
    } catch (error: any) {
      toast({
        title: "Error fetching employee data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteEmployee = async () => {
    // Only admin users can delete employees
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can delete employee records.",
        variant: "destructive"
      });
      return;
    }
    
    if (!confirm("Are you sure you want to delete this employee record?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Employee deleted",
        description: "The employee record has been successfully deleted.",
      });
      
      // Navigate back to employees list
      navigate("/employees");
    } catch (error: any) {
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  
  if (!employee) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mt-4 text-xl font-medium">Employee not found</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            The employee record you are looking for does not exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/employees")} className="mt-4">
            Back to Employees
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/employees")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Employee Details</h1>
          
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/employee/edit/${employee.id}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              
              <Button variant="destructive" onClick={deleteEmployee}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <h3 className="font-semibold text-lg">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-muted-foreground">{employee.job_title}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p>{employee.department}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Hire Date</p>
                <p>{formatDate(employee.hire_date)}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Salary</p>
                <p className="font-semibold">{formatCurrency(employee.salary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p>{employee.phone_number || "Not provided"}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{employee.address || "Not provided"}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                <p>{employee.emergency_contact || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Record Created</p>
                <p>{formatDate(employee.created_at)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p>{formatDate(employee.updated_at)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Record ID</p>
                <p className="font-mono text-xs">{employee.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default EmployeeDetails;
