
import { EmployeeChangesReport as EmployeeChangesReportComponent } from "./employee-changes/EmployeeChangesReport";
import { useLocation } from "react-router-dom";

export function EmployeeChangesReport() {
  const location = useLocation();
  const isDirectAccess = location.pathname === "/employee-changes-report";

  // If accessed directly, include title. Otherwise, ReportsNavigation will handle the title
  return <EmployeeChangesReportComponent standalone={isDirectAccess} />;
}
