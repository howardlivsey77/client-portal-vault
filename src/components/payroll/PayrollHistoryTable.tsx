
import { useState, useEffect } from 'react';
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Eye } from "lucide-react";
import { generatePayslip } from "@/utils/payslipGenerator";
import { formatCurrency } from "@/lib/formatters";
import { PayrollResult } from "@/services/payroll/types";

interface PayrollHistoryItem {
  id: string;
  employee_id: string;
  payroll_period: string;
  tax_code: string;
  gross_pay_this_period: number;
  income_tax_this_period: number;
  nic_employee_this_period: number;
  student_loan_this_period: number;
  employee_pension_this_period: number;
  net_pay_this_period: number;
  created_at: string;
  employee_name?: string;
}

export function PayrollHistoryTable() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [payrollHistory, setPayrollHistory] = useState<PayrollHistoryItem[]>([]);

  useEffect(() => {
    async function fetchPayrollHistory() {
      try {
        setLoading(true);
        
        // Fetch payroll results with employee details
        const { data, error } = await supabase
          .from('payroll_results')
          .select(`
            *,
            employees:employee_id (
              first_name,
              last_name
            )
          `)
          .order('payroll_period', { ascending: false })
          .limit(100);
          
        if (error) {
          console.error("Error fetching payroll history:", error);
          toast({
            title: "Error",
            description: "Failed to fetch payroll history",
            variant: "destructive"
          });
          return;
        }
        
        // Process the data to include employee names
        const processedData = data.map((item: any) => ({
          ...item,
          employee_name: item.employees ? 
            `${item.employees.first_name} ${item.employees.last_name}` : 
            'Unknown Employee'
        }));
        
        setPayrollHistory(processedData);
      } catch (error) {
        console.error("Error in fetchPayrollHistory:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPayrollHistory();
  }, [toast]);

  const handleDownloadPayslip = (item: PayrollHistoryItem) => {
    try {
      const payrollPeriod = new Date(item.payroll_period).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      });
      
      // Convert db values from pence to pounds and create a complete PayrollResult object
      const payrollData: PayrollResult = {
        employeeId: item.employee_id,
        employeeName: item.employee_name || 'Employee',
        taxCode: item.tax_code,
        grossPay: item.gross_pay_this_period / 100,
        incomeTax: item.income_tax_this_period / 100,
        nationalInsurance: item.nic_employee_this_period / 100,
        studentLoan: item.student_loan_this_period / 100,
        pensionContribution: item.employee_pension_this_period / 100,
        netPay: item.net_pay_this_period / 100,
        // Required fields for PayrollResult type that weren't in our original object
        monthlySalary: item.gross_pay_this_period / 100,
        additionalDeductions: [],
        additionalAllowances: [],
        additionalEarnings: [],
        totalDeductions: (
          item.income_tax_this_period + 
          item.nic_employee_this_period + 
          item.student_loan_this_period + 
          item.employee_pension_this_period
        ) / 100,
        totalAllowances: 0
      };
      
      const filename = `${item.employee_name?.replace(/\s+/g, '-').toLowerCase() || 'employee'}-payslip-${item.payroll_period}.pdf`;
      generatePayslip(payrollData, payrollPeriod, filename);
      
      toast({
        title: "Payslip Generated",
        description: "Your payslip has been downloaded."
      });
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payrollHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-muted-foreground">No payroll history found.</p>
            <p className="text-muted-foreground">Use the calculator tab to process and save payroll results.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Tax Code</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Income Tax</TableHead>
                <TableHead className="text-right">NI</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.employee_name}</TableCell>
                  <TableCell>{new Date(item.payroll_period).toLocaleDateString('en-GB', { 
                    month: 'long', 
                    year: 'numeric'
                  })}</TableCell>
                  <TableCell>{item.tax_code}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.gross_pay_this_period / 100)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.income_tax_this_period / 100)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.nic_employee_this_period / 100)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.net_pay_this_period / 100)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownloadPayslip(item)}
                      title="Download Payslip"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
