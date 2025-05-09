
import { useState } from "react";
import { formatCurrency, formatDate, roundToTwoDecimals } from "@/lib/formatters";
import { Employee } from "@/types/employeeDetails";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { genderOptions, departments } from "@/types/employee";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PersonalInfoCardProps {
  employee: Employee;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

// Form schema
const personalInfoSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  department: z.string().min(1, "Department is required"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional().nullable(),
  payroll_id: z.string().optional().nullable(),
  date_of_birth: z.date().optional().nullable(),
  hours_per_week: z.coerce.number().min(0, "Hours per week must be a positive number").default(40),
  hourly_rate: z.coerce.number().min(0, "Hourly rate must be a positive number").default(0),
  rate_2: z.coerce.number().min(0, "Rate must be a positive number").nullable().optional(),
  rate_3: z.coerce.number().min(0, "Rate must be a positive number").nullable().optional(),
  rate_4: z.coerce.number().min(0, "Rate must be a positive number").nullable().optional(),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

export const PersonalInfoCard = ({ employee, isAdmin, updateEmployeeField }: PersonalInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // Setup form
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: employee.first_name,
      last_name: employee.last_name,
      department: employee.department,
      gender: employee.gender as "Male" | "Female" | "Other" | "Prefer not to say" | null,
      payroll_id: employee.payroll_id,
      date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
      hours_per_week: employee.hours_per_week ?? 40,
      hourly_rate: employee.hourly_rate ?? 0,
      rate_2: employee.rate_2,
      rate_3: employee.rate_3,
      rate_4: employee.rate_4,
    }
  });

  // Handle edit mode toggle
  const toggleEditMode = () => {
    if (isEditing) {
      // If we're currently editing, reset form to original values
      form.reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        department: employee.department,
        gender: employee.gender as "Male" | "Female" | "Other" | "Prefer not to say" | null,
        payroll_id: employee.payroll_id,
        date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
        hours_per_week: employee.hours_per_week ?? 40,
        hourly_rate: employee.hourly_rate ?? 0,
        rate_2: employee.rate_2,
        rate_3: employee.rate_3,
        rate_4: employee.rate_4,
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle save
  const onSubmit = async (data: PersonalInfoFormValues) => {
    const fieldsToUpdate: Record<string, any> = {
      first_name: data.first_name,
      last_name: data.last_name,
      department: data.department,
      gender: data.gender,
      payroll_id: data.payroll_id,
      date_of_birth: data.date_of_birth ? data.date_of_birth.toISOString() : null,
      hours_per_week: data.hours_per_week,
      hourly_rate: data.hourly_rate,
      rate_2: data.rate_2,
      rate_3: data.rate_3,
      rate_4: data.rate_4,
    };

    // Update fields one by one
    for (const [field, value] of Object.entries(fieldsToUpdate)) {
      await updateEmployeeField(field, value);
    }

    // Exit edit mode
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {isAdmin && (
          <div>
            {isEditing ? (
              <Button 
                type="button" 
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={toggleEditMode}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
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

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payroll_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payroll ID</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hours_per_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Per Week</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Hourly Rate</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rate_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            value={field.value ?? ''} 
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rate_3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate 3 (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            value={field.value ?? ''} 
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rate_4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate 4 (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            value={field.value ?? ''} 
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              /* Display mode */
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    {employee.first_name} {employee.last_name}
                  </h3>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p>{employee.department}</p>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p>{employee.gender || "Not specified"}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Hourly Rates</p>
                  <p>Default Rate: {formatCurrency(roundToTwoDecimals(employee.hourly_rate || 0) || 0)}</p>
                  {employee.rate_2 && <p>Rate 2: {formatCurrency(roundToTwoDecimals(employee.rate_2) || 0)}</p>}
                  {employee.rate_3 && <p>Rate 3: {formatCurrency(roundToTwoDecimals(employee.rate_3) || 0)}</p>}
                  {employee.rate_4 && <p>Rate 4: {formatCurrency(roundToTwoDecimals(employee.rate_4) || 0)}</p>}
                </div>
              </div>
            )}
            {/* Hidden submit button to enable form submission */}
            <button type="submit" className="hidden" />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
