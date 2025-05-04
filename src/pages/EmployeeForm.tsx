
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
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
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, EmployeeFormValues, departments } from "@/types/employee";
import { PersonalInfoFields } from "@/components/employees/PersonalInfoFields";
import { JobInfoFields } from "@/components/employees/JobInfoFields";
import { CompensationFields } from "@/components/employees/CompensationFields";
import { ContactFields } from "@/components/employees/ContactFields";
import { AddressFields } from "@/components/employees/AddressFields";
import { HireDateField } from "@/components/employees/HireDateField";
import { EmployeeFormActions } from "@/components/employees/EmployeeFormActions";
import { fetchEmployeeById, createEmployee, updateEmployee } from "@/services/employeeService";

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
      hours_per_week: 40,
      hourly_rate: 0,
      date_of_birth: null,
      hire_date: new Date(),
      email: "",
      phone_number: "",
      address1: "",
      address2: "",
      address3: "",
      address4: "",
      postcode: "",
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
      if (!id) return;
      const data = await fetchEmployeeById(id);
      
      if (data) {
        // Convert date_of_birth string to Date object if it exists
        const dateOfBirth = data.date_of_birth ? new Date(data.date_of_birth) : null;
        const hireDate = data.hire_date ? new Date(data.hire_date) : new Date();
        
        form.reset({
          first_name: data.first_name,
          last_name: data.last_name,
          job_title: data.job_title,
          department: data.department,
          salary: data.salary,
          hours_per_week: data.hours_per_week || 40,
          hourly_rate: data.hourly_rate || 0,
          date_of_birth: dateOfBirth,
          hire_date: hireDate,
          email: data.email || "",
          phone_number: data.phone_number || "",
          address1: data.address1 || "",
          address2: data.address2 || "",
          address3: data.address3 || "",
          address4: data.address4 || "",
          postcode: data.postcode || "",
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
      
      if (isEditMode && id) {
        // Update existing employee
        await updateEmployee(id, data);
        
        toast({
          title: "Employee updated",
          description: "Employee information has been updated successfully.",
        });
      } else {
        // Create new employee
        await createEmployee(data, user.id);
        
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
              {/* Personal Information */}
              <PersonalInfoFields form={form} readOnly={readOnly} />
              
              {/* Job Information */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <JobInfoFields form={form} readOnly={readOnly} departments={departments} />
                <HireDateField form={form} readOnly={readOnly} />
              </div>
              
              {/* Compensation Information */}
              <CompensationFields form={form} readOnly={readOnly} />
              
              {/* Contact Information */}
              <ContactFields form={form} readOnly={readOnly} />
              
              {/* Address Information */}
              <AddressFields form={form} readOnly={readOnly} />
            </CardContent>
            
            <CardFooter>
              <EmployeeFormActions 
                isAdmin={isAdmin}
                readOnly={readOnly}
                isEditMode={isEditMode}
                submitLoading={submitLoading}
                onCancel={() => navigate("/employees")}
                setReadOnly={setReadOnly}
              />
            </CardFooter>
          </form>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default EmployeeForm;
