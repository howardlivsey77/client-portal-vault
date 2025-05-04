
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
  hours_per_week: number | null;
  hourly_rate: number | null;
  email: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  postcode: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  date_of_birth: string | null;
  payroll_id: string | null;
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
  
  // Format address for display
  const formattedAddress = [
    employee.address1,
    employee.address2,
    employee.address3,
    employee.address4,
    employee.postcode
  ].filter(Boolean).join(", ");
  
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
                <p className="text-sm font-medium text-muted-foreground">Payroll ID</p>
                <p>{employee.payroll_id || "Not assigned"}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p>{employee.date_of_birth ? formatDate(employee.date_of_birth) : "Not provided"}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Hire Date</p>
                <p>{employee.hire_date ? formatDate(employee.hire_date) : "Not provided"}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Hours Per Week</p>
                <p>{employee.hours_per_week || 40}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                <p>{formatCurrency(employee.hourly_rate || 0)}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{employee.email || "Not provided"}</p>
              </div>
              
              <div className="mt-2">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <div className="space-y-1">
                  {employee.address1 && <p>{employee.address1}</p>}
                  {employee.address2 && <p>{employee.address2}</p>}
                  {employee.address3 && <p>{employee.address3}</p>}
                  {employee.address4 && <p>{employee.address4}</p>}
                  {employee.postcode && <p>{employee.postcode}</p>}
                  {!formattedAddress && <p>Not provided</p>}
                </div>
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
