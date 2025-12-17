import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";
import { useCompany } from "@/providers/CompanyProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PayslipPreview } from "./PayslipPreview";
import { generatePayslipPdf } from "./payslipPdfGenerator";
import { PayslipData, CompanyDetails } from "./types";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mockEmployees, mockPayrollPeriods, mockPayrollResults, mockCompany } from "./mockData";

// Set to true to use simulated data, false to use real database data
const USE_SIMULATED_DATA = true;

export function PayslipReport() {
  const { currentCompany } = useCompany();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch employees (real data)
  const { data: realEmployees = [] } = useQuery({
    queryKey: ["employees", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, payroll_id, department, tax_code, national_insurance_number, nic_code, address1, address2, address3, address4, postcode")
        .eq("company_id", currentCompany.id)
        .order("last_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id && !USE_SIMULATED_DATA,
  });

  // Fetch payroll periods (real data)
  const { data: realPayrollPeriods = [] } = useQuery({
    queryKey: ["payroll-periods", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { data, error } = await supabase
        .from("payroll_periods")
        .select("id, period_number, period_name, date_from, date_to, financial_year")
        .eq("company_id", currentCompany.id)
        .order("financial_year", { ascending: false })
        .order("period_number", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id && !USE_SIMULATED_DATA,
  });

  // Fetch payroll results for selected employee and period (real data)
  const { data: realPayrollResult } = useQuery({
    queryKey: ["payroll-result", selectedEmployee, selectedPeriod],
    queryFn: async () => {
      if (!selectedEmployee || !selectedPeriod) return null;
      const { data, error } = await supabase
        .from("payroll_results")
        .select("*")
        .eq("employee_id", selectedEmployee)
        .eq("payroll_period", selectedPeriod)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!selectedEmployee && !!selectedPeriod && !USE_SIMULATED_DATA,
  });

  // Use simulated or real data based on flag
  const employees = USE_SIMULATED_DATA ? mockEmployees : realEmployees;
  const payrollPeriods = USE_SIMULATED_DATA ? mockPayrollPeriods : realPayrollPeriods;
  
  // Get mock payroll result if using simulated data
  const mockPayrollResultKey = `${selectedEmployee}_${selectedPeriod}`;
  const payrollResult = USE_SIMULATED_DATA 
    ? mockPayrollResults[mockPayrollResultKey] || null
    : realPayrollResult;

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);
  const selectedPeriodData = payrollPeriods.find(p => p.id === selectedPeriod);

  // Build payslip data for preview/PDF
  const buildPayslipData = (): PayslipData | null => {
    if (!selectedEmployeeData || !selectedPeriodData || !payrollResult) return null;

    const payments: Array<{ description: string; amount: number }> = [];
    
    // Add basic salary/pay
    if (payrollResult.gross_pay_this_period > 0) {
      payments.push({
        description: "Basic Pay",
        amount: payrollResult.gross_pay_this_period,
      });
    }

    const deductions: Array<{ description: string; amount: number }> = [];
    
    if (payrollResult.income_tax_this_period > 0) {
      deductions.push({ description: "Tax", amount: payrollResult.income_tax_this_period });
    }
    if (payrollResult.nic_employee_this_period > 0) {
      deductions.push({ description: "National Insurance", amount: payrollResult.nic_employee_this_period });
    }
    if (payrollResult.employee_pension_this_period > 0) {
      deductions.push({ description: "Pension", amount: payrollResult.employee_pension_this_period });
    }
    if (payrollResult.nhs_pension_employee_this_period && payrollResult.nhs_pension_employee_this_period > 0) {
      deductions.push({ description: "NHS Pension", amount: payrollResult.nhs_pension_employee_this_period });
    }
    if (payrollResult.student_loan_this_period > 0) {
      deductions.push({ description: `Student Loan (Plan ${payrollResult.student_loan_plan})`, amount: payrollResult.student_loan_this_period });
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    return {
      employeeId: selectedEmployeeData.id,
      employeeName: `${selectedEmployeeData.first_name} ${selectedEmployeeData.last_name}`,
      payrollId: selectedEmployeeData.payroll_id || undefined,
      address: {
        line1: selectedEmployeeData.address1 || undefined,
        line2: selectedEmployeeData.address2 || undefined,
        line3: selectedEmployeeData.address3 || undefined,
        line4: selectedEmployeeData.address4 || undefined,
        postcode: selectedEmployeeData.postcode || undefined,
      },
      department: selectedEmployeeData.department || undefined,
      taxCode: payrollResult.tax_code,
      niNumber: selectedEmployeeData.national_insurance_number || undefined,
      niTable: payrollResult.nic_letter,
      periodNumber: selectedPeriodData.period_number,
      periodName: selectedPeriodData.period_name || `Month ${selectedPeriodData.period_number}`,
      paymentDate: selectedPeriodData.date_to,
      payments,
      grossPay: payrollResult.gross_pay_this_period,
      deductions,
      totalDeductions,
      netPay: payrollResult.net_pay_this_period,
      thisPeriod: {
        taxableGrossPay: payrollResult.taxable_pay_this_period,
        employerNI: payrollResult.nic_employer_this_period,
      },
      yearToDate: {
        taxableGrossPay: payrollResult.taxable_pay_ytd || 0,
        tax: payrollResult.income_tax_ytd || 0,
        employeeNI: payrollResult.nic_employee_ytd || 0,
        employerNI: 0,
        employeePension: payrollResult.nhs_pension_employee_ytd || 0,
        employerPension: payrollResult.nhs_pension_employer_ytd || 0,
      },
    };
  };

  const getCompanyDetails = (): CompanyDetails => {
    const company = USE_SIMULATED_DATA ? mockCompany : currentCompany;
    return {
      name: company?.name || "Company Name",
      tradingAs: company?.trading_as || undefined,
      payeRef: company?.paye_ref || undefined,
      addressLine1: company?.address_line1 || undefined,
      addressLine2: company?.address_line2 || undefined,
      addressLine3: company?.address_line3 || undefined,
      addressLine4: company?.address_line4 || undefined,
      postCode: company?.post_code || undefined,
      logoUrl: company?.logo_url || undefined,
    };
  };

  const handleDownloadPdf = async () => {
    const payslipData = buildPayslipData();
    if (!payslipData) {
      toast.error("Please select an employee and period with payroll data");
      return;
    }

    setIsGenerating(true);
    try {
      await generatePayslipPdf({
        payslipData,
        company: getCompanyDetails(),
      });
      toast.success("Payslip PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const payslipData = buildPayslipData();

  return (
    <div className="space-y-6">
      {USE_SIMULATED_DATA && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <strong>Demo Mode:</strong> Displaying simulated payslip data for demonstration purposes.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Employee</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} {emp.payroll_id && `(${emp.payroll_id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Pay Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {payrollPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.period_name || `Period ${period.period_number}`} ({period.financial_year}/{period.financial_year + 1})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleDownloadPdf}
              disabled={!payslipData || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
        </div>

        {!selectedEmployee || !selectedPeriod ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select an employee and pay period to preview the payslip</p>
          </div>
        ) : !payrollResult ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payroll data found for the selected employee and period</p>
          </div>
        ) : payslipData ? (
          <PayslipPreview
            payslipData={payslipData}
            company={getCompanyDetails()}
          />
        ) : null}
      </Card>
    </div>
  );
}
