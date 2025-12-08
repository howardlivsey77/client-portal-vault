
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SicknessRecord } from "@/types/sickness";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { Calendar, Plus, Edit, Trash, FileText, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { calculateWorkingDaysForRecord } from "./utils/workingDaysCalculations";
import { useToast } from "@/hooks/use-toast";
import { sicknessService } from "@/services";

interface SicknessRecordsListProps {
  records: SicknessRecord[];
  loading?: boolean;
  isAdmin: boolean;
  workPattern: WorkDay[];
  employeeId: string;
  onAddRecord: () => void;
  onEditRecord: (record: SicknessRecord) => void;
  onDeleteRecord: (id: string) => void;
  onRecordsUpdated: () => void;
}

export const SicknessRecordsList = ({
  records,
  loading,
  isAdmin,
  workPattern,
  employeeId,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onRecordsUpdated
}: SicknessRecordsListProps) => {
  const [recalculating, setRecalculating] = useState(false);
  const { toast } = useToast();

  const getComputedWorkingDays = (record: SicknessRecord): number => {
    return calculateWorkingDaysForRecord(
      record.start_date,
      record.end_date,
      workPattern
    );
  };

  const handleRecalculateTotals = async () => {
    if (!isAdmin) return;
    
    setRecalculating(true);
    try {
      let updatedCount = 0;
      
      for (const record of records) {
        const computedDays = getComputedWorkingDays(record);
        
        // Only update if the computed days differ from stored days
        if (computedDays !== record.total_days) {
          await sicknessService.updateSicknessRecord(record.id, {
            total_days: computedDays
          });
          updatedCount++;
        }
      }

      toast({
        title: "Recalculation Complete",
        description: `Updated ${updatedCount} record(s) with correct working days.`,
      });

      if (updatedCount > 0) {
        onRecordsUpdated();
      }
    } catch (error) {
      console.error('Error recalculating totals:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate working days totals.",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };
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
        <div className="flex gap-2">
          {isAdmin && records.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculateTotals}
              disabled={recalculating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculate Totals
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={onAddRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          )}
        </div>
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
            {records.map((record) => {
              const computedWorkingDays = getComputedWorkingDays(record);
              const hasDiscrepancy = computedWorkingDays !== record.total_days;
              
              return (
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            Working days: {computedWorkingDays}
                            {hasDiscrepancy && (
                              <span className="text-orange-600 ml-1">
                                (stored: {record.total_days})
                              </span>
                            )}
                          </span>
                        </div>
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
                        {hasDiscrepancy && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            Needs Recalc
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
