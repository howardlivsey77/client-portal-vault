import React from "react";
import { PayslipData, CompanyDetails } from "./types";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface PayslipPreviewProps {
  payslipData: PayslipData;
  company: CompanyDetails;
}

export function PayslipPreview({ payslipData, company }: PayslipPreviewProps) {
  const formatAddress = () => {
    const parts = [
      payslipData.address?.line1,
      payslipData.address?.line2,
      payslipData.address?.line3,
      payslipData.address?.line4,
      payslipData.address?.postcode,
    ].filter(Boolean);
    return parts;
  };

  const companyAddressLine = [
    company.name,
    company.payeRef && `(${company.payeRef})`,
    company.addressLine1,
    company.addressLine2,
    company.addressLine3,
    company.postCode,
  ].filter(Boolean).join(", ");

  return (
    <div className="bg-white border rounded-lg p-6 font-sans text-sm print:p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {payslipData.employeeName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Period {payslipData.periodNumber} - {payslipData.periodName}
          </p>
        </div>
        <div className="text-right">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-12 max-w-[180px] object-contain ml-auto"
            />
          ) : (
            <div className="text-lg font-semibold text-primary">
              {company.name}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Employee Details */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Employee Details</h3>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground whitespace-nowrap">Address</td>
                  <td className="p-2 text-right font-medium">
                    {formatAddress().map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </td>
                </tr>
                {payslipData.payrollId && (
                  <tr className="border-b">
                    <td className="p-2 text-muted-foreground whitespace-nowrap">Works number</td>
                    <td className="p-2 text-right font-medium">{payslipData.payrollId}</td>
                  </tr>
                )}
                {payslipData.department && (
                  <tr className="border-b">
                    <td className="p-2 text-muted-foreground whitespace-nowrap">Department</td>
                    <td className="p-2 text-right font-medium">{payslipData.department}</td>
                  </tr>
                )}
                <tr className="border-b">
                  <td className="p-2 text-muted-foreground whitespace-nowrap">Tax code</td>
                  <td className="p-2 text-right font-medium">{payslipData.taxCode}</td>
                </tr>
                {payslipData.niNumber && (
                  <tr className="border-b">
                    <td className="p-2 text-muted-foreground whitespace-nowrap">NI number</td>
                    <td className="p-2 text-right font-medium">{payslipData.niNumber}</td>
                  </tr>
                )}
                {payslipData.niTable && (
                  <tr>
                    <td className="p-2 text-muted-foreground whitespace-nowrap">NI table</td>
                    <td className="p-2 text-right font-medium">{payslipData.niTable}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Payments</h3>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {payslipData.payments.map((payment, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{payment.description}</td>
                    <td className="p-2 text-right font-medium whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="p-2 italic text-muted-foreground">Total</td>
                  <td className="p-2 text-right font-semibold whitespace-nowrap">{formatCurrency(payslipData.grossPay)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Deductions */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Deductions</h3>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {payslipData.deductions.map((deduction, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{deduction.description}</td>
                    <td className="p-2 text-right font-medium whitespace-nowrap">{formatCurrency(deduction.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="p-2 italic text-muted-foreground">Total</td>
                  <td className="p-2 text-right font-semibold whitespace-nowrap">{formatCurrency(payslipData.totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section - This Month, Year to Date, Payment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
        {/* This Month */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">This Month</h3>
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="py-1.5 whitespace-nowrap">Taxable gross pay</td>
                <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatCurrency(payslipData.thisPeriod.taxableGrossPay)}</td>
              </tr>
              <tr>
                <td className="py-1.5 whitespace-nowrap">Employer NI</td>
                <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatCurrency(payslipData.thisPeriod.employerNI)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Year to Date */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Year to Date</h3>
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="py-1.5 whitespace-nowrap">Taxable gross pay</td>
                <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatCurrency(payslipData.yearToDate.taxableGrossPay)}</td>
              </tr>
              <tr>
                <td className="py-1.5 whitespace-nowrap">Tax</td>
                <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatCurrency(payslipData.yearToDate.tax)}</td>
              </tr>
              <tr>
                <td className="py-1.5 whitespace-nowrap">Employee NI</td>
                <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatCurrency(payslipData.yearToDate.employeeNI)}</td>
              </tr>
              {payslipData.yearToDate.employeePension > 0 && (
                <tr>
                  <td className="py-1.5 whitespace-nowrap">Employee pension</td>
                  <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatCurrency(payslipData.yearToDate.employeePension)}</td>
                </tr>
              )}
              {payslipData.yearToDate.employerPension > 0 && (
                <tr>
                  <td className="py-1.5 whitespace-nowrap">Employer pension</td>
                  <td className="py-1.5 text-right font-medium whitespace-nowrap">{formatCurrency(payslipData.yearToDate.employerPension)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment */}
        <div className="text-right">
          <h3 className="font-semibold mb-3 text-foreground">Payment</h3>
          <div className="text-3xl font-bold text-primary mb-2">
            {formatCurrency(payslipData.netPay)}
          </div>
          <div className="text-xs text-muted-foreground">
            Paid {formatDate(payslipData.paymentDate)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
        <strong>{company.name}</strong> {companyAddressLine !== company.name && companyAddressLine.replace(`${company.name}, `, '')}
      </div>
    </div>
  );
}
