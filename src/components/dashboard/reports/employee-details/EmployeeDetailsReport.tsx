import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Download, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/types/employee-types";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface EmployeeDetailsReportProps {
  standalone?: boolean;
}

interface EmployeeDetailsData {
  id: string;
  full_name: string;
  department: string;
  hire_date: string;
  payroll_id?: string;
}

export function EmployeeDetailsReport({ standalone = false }: EmployeeDetailsReportProps) {
  const [employees, setEmployees] = useState<EmployeeDetailsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, department, hire_date, payroll_id')
        .order('last_name', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedData: EmployeeDetailsData[] = data?.map(emp => ({
        id: emp.id,
        full_name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        hire_date: emp.hire_date ? format(new Date(emp.hire_date), "dd/MM/yyyy") : "N/A",
        payroll_id: emp.payroll_id || "N/A"
      })) || [];

      setEmployees(formattedData);
      setTotalEmployees(formattedData.length);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employee details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = employees.map(emp => ({
        'Employee ID': emp.payroll_id,
        'Full Name': emp.full_name,
        'Department': emp.department,
        'Start Date': emp.hire_date
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Details");

      // Auto-size columns
      const cols = [
        { width: 15 }, // Employee ID
        { width: 25 }, // Full Name
        { width: 20 }, // Department
        { width: 15 }  // Start Date
      ];
      worksheet['!cols'] = cols;

      const fileName = `employee-details-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Successful",
        description: "Employee details report has been downloaded",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading employee details...</div>;
  }

  return (
    <div className="space-y-6">
      {standalone && (
        <div className="flex items-center justify-between">
          <h2 className="monday-section-title flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Details Report
          </h2>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-monday-blue/10 rounded-lg">
              <Users className="h-5 w-5 text-monday-blue" />
            </div>
            <div>
              <p className="text-sm text-monday-gray">Total Employees</p>
              <p className="text-2xl font-semibold text-monday-dark">{totalEmployees}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-monday-gray">Report Generated</p>
              <p className="text-sm font-medium text-monday-dark">
                {format(new Date(), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="flex justify-end gap-2">
        <Button 
          onClick={exportToExcel}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Employee Details Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-monday-border bg-monday-light">
          <h3 className="font-medium text-monday-dark">Employee Details</h3>
          <p className="text-sm text-monday-gray">
            Complete list of all employees with basic information
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-monday-gray">
                    No employee data available
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-monday-dark">
                      {employee.payroll_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-monday-dark font-medium">
                      {employee.full_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-monday-gray">
                      {employee.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-monday-gray">
                      {employee.hire_date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}