
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
                  </div>
                  <div>
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
                </div>

                <div>
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
                </div>

                <div>
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
                </div>

                <div>
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
                </div>

                <div>
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
                </div>

                <div>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
                  </div>

                  <div>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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
                  </div>

                  <div>
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
                </div>
              </>
            ) : (
              /* Display mode - Modified to match the image layout */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-2">First Name</div>
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      {employee.first_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Last Name</div>
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      {employee.last_name}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Department</div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                    {employee.department}
                    <span className="text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Gender</div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                    {employee.gender || "Not specified"}
                    <span className="text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Payroll ID</div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    {employee.payroll_id || "Not assigned"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Date of Birth</div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                    {employee.date_of_birth ? formatDate(employee.date_of_birth) : "Not provided"}
                    <span className="text-gray-400">
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Hours Per Week</div>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    {employee.hours_per_week || "40"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-2">Default Hourly Rate</div>
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      {formatCurrency(roundToTwoDecimals(employee.hourly_rate || 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Rate 2 (Optional)</div>
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      {employee.rate_2 ? formatCurrency(roundToTwoDecimals(employee.rate_2)) : ""}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-2">Rate 3 (Optional)</div>
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      {employee.rate_3 ? formatCurrency(roundToTwoDecimals(employee.rate_3)) : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Rate 4 (Optional)</div>
                    <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                      {employee.rate_4 ? formatCurrency(roundToTwoDecimals(employee.rate_4)) : ""}
                    </div>
                  </div>
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
