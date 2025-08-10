
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SicknessRecord } from "@/types/sickness";
import { Calendar, Plus, Edit, Trash, FileText } from "lucide-react";
import { format } from "date-fns";

interface SicknessRecordsListProps {
  records: SicknessRecord[];
  loading?: boolean;
  isAdmin: boolean;
  onAddRecord: () => void;
  onEditRecord: (record: SicknessRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const SicknessRecordsList = ({
  records,
  loading,
  isAdmin,
  onAddRecord,
  onEditRecord,
  onDeleteRecord
}: SicknessRecordsListProps) => {
  if (loading) {
    return (
      <Card className="border-[1.5px] border-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sickness Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading sickness records...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[1.5px] border-foreground">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sickness Records
        </CardTitle>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={onAddRecord}>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sickness records found</p>
            {isAdmin && (
              <Button variant="outline" className="mt-4" onClick={onAddRecord}>
                Add First Record
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {format(new Date(record.start_date), 'dd MMM yyyy')}
                        {record.end_date && (
                          <span> - {format(new Date(record.end_date), 'dd MMM yyyy')}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.total_days} days
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {record.is_certified && (
                        <Badge variant="outline" className="bg-green-50">
                          <FileText className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      )}
                      {!record.end_date && (
                        <Badge variant="outline" className="bg-yellow-50">
                          Ongoing
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRecord(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRecord(record.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {record.reason && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Reason:</strong> {record.reason}
                  </p>
                )}
                
                {record.notes && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Notes:</strong> {record.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
