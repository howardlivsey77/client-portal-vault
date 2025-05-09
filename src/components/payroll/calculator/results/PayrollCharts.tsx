
import { PayrollResult } from "@/services/payroll/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, BarChart, ResponsiveContainer, Pie, Cell, Tooltip, Legend, Bar, XAxis, YAxis } from "recharts";

interface PayrollChartsProps {
  result: PayrollResult;
}

export function PayrollCharts({ result }: PayrollChartsProps) {
  // Prepare data for pie chart (deductions breakdown)
  const deductionsData = [
    { name: "Income Tax", value: result.incomeTax, color: "#ef4444" },
    { name: "National Insurance", value: result.nationalInsurance, color: "#f97316" },
  ];
  
  // Add student loan if applicable
  if (result.studentLoan > 0) {
    deductionsData.push({ 
      name: "Student Loan", 
      value: result.studentLoan, 
      color: "#f59e0b" 
    });
  }
  
  // Add pension if applicable
  if (result.pensionContribution > 0) {
    deductionsData.push({ 
      name: "Pension", 
      value: result.pensionContribution, 
      color: "#84cc16" 
    });
  }

  // Prepare data for bar chart (gross vs net)
  const payComparisonData = [
    { name: "Gross Pay", amount: result.grossPay },
    { name: "Net Pay", amount: result.netPay },
    { name: "Deductions", amount: result.totalDeductions },
  ];

  // Prepare data for YTD comparison if available
  const hasYtdData = result.taxPeriod > 1 && (
    result.incomeTaxYTD > result.incomeTax || 
    result.nationalInsuranceYTD > result.nationalInsurance || 
    result.grossPayYTD > result.grossPay
  );

  const ytdComparisonData = hasYtdData ? [
    { name: "Period", gross: result.grossPay, net: result.netPay, tax: result.incomeTax, ni: result.nationalInsurance },
    { name: "YTD", gross: result.grossPayYTD || 0, net: result.netPay * result.taxPeriod, tax: result.incomeTaxYTD || 0, ni: result.nationalInsuranceYTD || 0 }
  ] : [];

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Visualization</CardTitle>
          <CardDescription>Visual breakdown of your payroll data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">Deductions Breakdown</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deductionsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {deductionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => {
                  return typeof value === 'number' 
                    ? `£${value.toFixed(2)}` 
                    : `£${value}`;
                }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">Pay Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={payComparisonData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => {
                  return typeof value === 'number' 
                    ? `£${value.toFixed(2)}` 
                    : `£${value}`;
                }} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {hasYtdData && (
        <Card>
          <CardHeader>
            <CardTitle>Period vs Year-to-Date</CardTitle>
            <CardDescription>Comparing this period with year-to-date totals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ytdComparisonData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => {
                  return typeof value === 'number' 
                    ? `£${value.toFixed(2)}` 
                    : `£${value}`;
                }} />
                <Legend />
                <Bar dataKey="gross" name="Gross Pay" fill="#3b82f6" />
                <Bar dataKey="net" name="Net Pay" fill="#22c55e" />
                <Bar dataKey="tax" name="Income Tax" fill="#ef4444" />
                <Bar dataKey="ni" name="National Insurance" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
