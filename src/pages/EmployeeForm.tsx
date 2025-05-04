import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Pencil, Save } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define form schema using zod
const employeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  job_title: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  salary: z.coerce.number().min(0, "Salary must be a positive number"),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const EmployeeForm = () => {
  const { id } = useParams();
  const isEditMode = id !== undefined && id !== "new";
  const [loading, setLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [readOnly, setReadOnly] = useState(!isAdmin);
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      job_title: "",
      department: "",
      salary: 0,
      phone_number: "",
      address: "",
      emergency_contact: "",
    },
  });
  
  // Fetch employee data if in edit mode
  useEffect(() => {
    if (isEditMode) {
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
      
      if (data) {
        form.reset({
          first_name: data.first_name,
          last_name: data.last_name,
          job_title: data.job_title,
          department: data.department,
          salary: data.salary,
          phone_number: data.phone_number || "",
          address: data.address || "",
          emergency_contact: data.emergency_contact || "",
        });
      }
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
  
  const onSubmit = async (data: EmployeeFormValues) => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You need administrator privileges to perform this action.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitLoading(true);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      if (isEditMode) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            job_title: data.job_title,
            department: data.department,
            salary: data.salary,
            phone_number: data.phone_number || null,
            address: data.address || null,
            emergency_contact: data.emergency_contact || null,
          })
          .eq("id", id);
          
        if (error) throw error;
        
        toast({
          title: "Employee updated",
          description: "Employee information has been updated successfully.",
        });
      } else {
        // Create new employee
        const { error } = await supabase
          .from("employees")
          .insert({
            user_id: user.id, // Assign the employee to the current user
            first_name: data.first_name,
            last_name: data.last_name,
            job_title: data.job_title,
            department: data.department,
            salary: data.salary,
            phone_number: data.phone_number || null,
            address: data.address || null,
            emergency_contact: data.emergency_contact || null,
          });
          
        if (error) throw error;
        
        toast({
          title: "Employee created",
          description: "A new employee has been added successfully.",
        });
      }
      
      // Redirect to employees list
      navigate("/employees");
    } catch (error: any) {
      toast({
        title: isEditMode ? "Error updating employee" : "Error creating employee",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitLoading(false);
    }
  };
  
  const departments = [
    "Engineering",
    "Sales",
    "Marketing",
    "Human Resources",
    "Finance",
    "Operations",
    "Customer Support",
    "Research & Development",
    "Legal",
    "Executive",
  ];
  
  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <h1 className="text-3xl font-bold">
          {isEditMode 
            ? (readOnly ? "View Employee" : "Edit Employee") 
            : "Add New Employee"}
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode 
              ? (readOnly ? "View Employee Information" : "Edit Employee Information") 
              : "New Employee Information"}
          </CardTitle>
          <CardDescription>
            {readOnly 
              ? "View employee details below." 
              : "Enter the employee details below. Required fields are marked with an asterisk (*)."}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="First name" 
                          {...field} 
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Last name" 
                          {...field} 
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Job title" 
                          {...field} 
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary (USD) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00"
                        min={0}
                        step="0.01"
                        {...field} 
                        disabled={readOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Phone number" 
                        {...field} 
                        disabled={readOnly}
                      />
                    </FormControl>
                    <FormDescription>Optional contact information</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Address" 
                        {...field} 
                        disabled={readOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="emergency_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Emergency contact details" 
                        {...field} 
                        disabled={readOnly}
                      />
                    </FormControl>
                    <FormDescription>Name and phone number of emergency contact</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => navigate("/employees")}
              >
                Cancel
              </Button>
              
              {isAdmin && !readOnly && (
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Update Employee" : "Save Employee"}
                </Button>
              )}
              
              {isAdmin && readOnly && isEditMode && (
                <Button 
                  type="button" 
                  onClick={() => setReadOnly(false)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default EmployeeForm;
