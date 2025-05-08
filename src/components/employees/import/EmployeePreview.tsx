
import { EmployeeData } from "./ImportConstants";

interface EmployeePreviewProps {
  preview: EmployeeData[];
}

export const EmployeePreview = ({ preview }: EmployeePreviewProps) => {
  if (preview.length === 0) {
    return null;
  }
  
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-sm font-medium mb-2">
        Preview: {preview.length} employees found
      </h3>
      <div className="max-h-60 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Department</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Base Rate</th>
              <th className="text-left py-2">Rates</th>
            </tr>
          </thead>
          <tbody>
            {preview.slice(0, 5).map((emp, i) => (
              <tr key={i} className="border-b">
                <td className="py-1">{emp.first_name} {emp.last_name}</td>
                <td className="py-1">{emp.department}</td>
                <td className="py-1">{emp.email || "-"}</td>
                <td className="py-1">{emp.hourly_rate || "-"}</td>
                <td className="py-1">
                  {[emp.rate_2, emp.rate_3, emp.rate_4]
                    .filter(rate => rate !== undefined && rate !== null && rate !== '')
                    .map((rate, i) => `£${rate}`).join(", ") || "-"}
                </td>
              </tr>
            ))}
            {preview.length > 5 && (
              <tr>
                <td colSpan={5} className="py-1 text-center">
                  ...{preview.length - 5} more
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
