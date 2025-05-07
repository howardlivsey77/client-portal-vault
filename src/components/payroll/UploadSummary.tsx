
import { FileText, Clock, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

type ExtraHoursSummary = {
  totalEntries: number;
  totalExtraHours: number;
  dateRange: {
    from: string;
    to: string;
  };
  employeeCount: number;
};

interface UploadSummaryProps {
  file: File | null;
  type: "extraHours" | "absences";
  getSummary: (file: File) => ExtraHoursSummary;
}

export function UploadSummary({ file, type, getSummary }: UploadSummaryProps) {
  if (!file) {
    return <div>No file uploaded</div>;
  }

  // Get summary data based on file type
  const summary = getSummary(file);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-md">
        <FileText className="h-6 w-6 text-monday-blue" />
        <div>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024).toFixed(2)} KB • Uploaded {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-semibold">{summary.totalExtraHours}</p>
            <p className="text-xs text-muted-foreground">Extra hours recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-semibold">{summary.totalEntries}</p>
            <p className="text-xs text-muted-foreground">Entries processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Period
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-sm font-medium">
              {summary.dateRange.from} - {summary.dateRange.to}
            </p>
            <p className="text-xs text-muted-foreground">Date range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-semibold">{summary.employeeCount}</p>
            <p className="text-xs text-muted-foreground">Staff members</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-3 bg-green-50 rounded-md text-center text-sm text-green-800">
        File validation complete. Click "Next" to continue with absences upload.
      </div>
    </div>
  );
}
