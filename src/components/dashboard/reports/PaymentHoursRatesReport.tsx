
import { PaymentHoursRatesReport as PaymentHoursRatesReportComponent } from "./payment-hours-rates/PaymentHoursRatesReport";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getProcessedPayrollData } from "@/components/payroll/hooks/usePayrollWizard";
import { ExtraHoursSummary } from "@/components/payroll/types";

export function PaymentHoursRatesReport() {
  const location = useLocation();
  const isDirectAccess = location.pathname === "/payment-hours-rates-report";
  const [reportData, setReportData] = useState<ExtraHoursSummary | null>(null);
  
  // Use data from our global store
  useEffect(() => {
    const data = getProcessedPayrollData();
    if (data) {
      setReportData(data);
    }
  }, []);

  return (
    <PaymentHoursRatesReportComponent 
      standalone={isDirectAccess} 
      data={reportData?.employeeDetails || []} 
    />
  );
}
