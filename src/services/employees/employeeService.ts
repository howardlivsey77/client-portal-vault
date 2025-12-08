import { supabase } from "@/integrations/supabase/client";
import { EmployeeFormValues } from "@/types/employee";

export const fetchEmployeeById = async (id: string) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Failed to fetch employee data");
  }

  return data;
};

export const createEmployee = async (employeeData: EmployeeFormValues, userId: string, companyId: string) => {
  // Transform the data to match the database schema
  const transformedData = {
    first_name: employeeData.first_name,
    last_name: employeeData.last_name,
    department: employeeData.department,
    hours_per_week: employeeData.hours_per_week,
    hourly_rate: employeeData.hourly_rate,
    rate_2: employeeData.rate_2,
    rate_3: employeeData.rate_3,
    rate_4: employeeData.rate_4,
    date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString().split('T')[0] : null,
    hire_date: employeeData.hire_date ? employeeData.hire_date.toISOString().split('T')[0] : null,
    email: employeeData.email || null,
    address1: employeeData.address1 || null,
    address2: employeeData.address2 || null,
    address3: employeeData.address3 || null,
    address4: employeeData.address4 || null,
    postcode: employeeData.postcode || null,
    payroll_id: employeeData.payroll_id || null,
    gender: employeeData.gender || null,
    work_pattern: employeeData.work_pattern || null,
    national_insurance_number: employeeData.national_insurance_number || null,
    user_id: userId,
    company_id: companyId,
    // HMRC fields
    tax_code: employeeData.tax_code || null,
    week_one_month_one: employeeData.week_one_month_one || false,
    nic_code: employeeData.nic_code || null,
    student_loan_plan: employeeData.student_loan_plan || null,
    // NHS pension fields
    nhs_pension_member: employeeData.nhs_pension_member || false,
    previous_year_pensionable_pay: employeeData.previous_year_pensionable_pay || null,
    nhs_pension_tier: employeeData.nhs_pension_tier || null,
    nhs_pension_employee_rate: employeeData.nhs_pension_employee_rate || null,
    // Status and leave date fields
    status: employeeData.status || "active",
    leave_date: employeeData.leave_date ? employeeData.leave_date.toISOString().split('T')[0] : null,
  };

  const { data, error } = await supabase
    .from("employees")
    .insert(transformedData)
    .select()
    .single();

  if (error) {
    console.error("Error creating employee:", error);
    throw new Error("Failed to create employee");
  }

  return data;
};

export const updateEmployee = async (id: string, employeeData: EmployeeFormValues) => {
  // Transform the data to match the database schema
  const transformedData = {
    first_name: employeeData.first_name,
    last_name: employeeData.last_name,
    department: employeeData.department,
    hours_per_week: employeeData.hours_per_week,
    hourly_rate: employeeData.hourly_rate,
    rate_2: employeeData.rate_2,
    rate_3: employeeData.rate_3,
    rate_4: employeeData.rate_4,
    date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString().split('T')[0] : null,
    hire_date: employeeData.hire_date ? employeeData.hire_date.toISOString().split('T')[0] : null,
    email: employeeData.email || null,
    address1: employeeData.address1 || null,
    address2: employeeData.address2 || null,
    address3: employeeData.address3 || null,
    address4: employeeData.address4 || null,
    postcode: employeeData.postcode || null,
    payroll_id: employeeData.payroll_id || null,
    gender: employeeData.gender || null,
    work_pattern: employeeData.work_pattern || null,
    // HMRC fields
    tax_code: employeeData.tax_code || null,
    week_one_month_one: employeeData.week_one_month_one || false,
    nic_code: employeeData.nic_code || null,
    student_loan_plan: employeeData.student_loan_plan || null,
    // NHS pension fields
    nhs_pension_member: employeeData.nhs_pension_member || false,
    previous_year_pensionable_pay: employeeData.previous_year_pensionable_pay || null,
    nhs_pension_tier: employeeData.nhs_pension_tier || null,
    nhs_pension_employee_rate: employeeData.nhs_pension_employee_rate || null,
    // Status and leave date fields
    status: employeeData.status || "active",
    leave_date: employeeData.leave_date ? employeeData.leave_date.toISOString().split('T')[0] : null,
  };

  const { data, error } = await supabase
    .from("employees")
    .update(transformedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating employee:", error);
    throw new Error("Failed to update employee");
  }

  return data;
};
