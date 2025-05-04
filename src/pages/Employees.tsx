
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, RefreshCw, Search, Trash2, UserCog, Users } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";

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
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    fetchEmployees();
  }, []);
  
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("last_name", { ascending: true });
        
      if (error) throw error;
      
      setEmployees(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching employees",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteEmployee = async (id: string) => {
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
      
      // Update the employees list
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error: any) {
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.first_name.toLowerCase().includes(searchLower) ||
      employee.last_name.toLowerCase().includes(searchLower) ||
      employee.job_title.toLowerCase().includes(searchLower) ||
      employee.department.toLowerCase().includes(searchLower)
    );
  });
  
  if (!isAdmin) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchEmployees} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={() => navigate("/employee/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Employee
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Manage employee records and information.
          </CardDescription>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search employees..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && employees.length === 0 ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </TableCell>
                      <TableCell>{employee.job_title}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{formatCurrency(employee.salary)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/employee/${employee.id}`)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEmployee(employee.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-xl font-medium">No employees found</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {searchTerm ? "No employees match your search criteria." : "Add your first employee to get started."}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate("/employee/new")} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Employees;
