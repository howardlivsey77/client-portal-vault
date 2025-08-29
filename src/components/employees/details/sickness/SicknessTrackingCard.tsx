
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SicknessEntitlementCard } from "./SicknessEntitlementCard";
import { SicknessRecordsList } from "./SicknessRecordsList";
import { SicknessRecordForm } from "./SicknessRecordForm";
import { useSicknessData } from "@/hooks/useSicknessData";
import { SicknessRecord, SicknessEntitlementSummary } from "@/types/sickness";
import { SicknessScheme, WorkDay } from "@/components/employees/details/work-pattern/types";
import { Employee } from "@/types/employee-types";
import { Activity, AlertCircle } from "lucide-react";
import { SicknessReportPDFButton } from "./SicknessReportPDFButton";
import { fetchWorkPatterns } from "@/components/employees/details/work-pattern/services/fetchPatterns";

interface SicknessTrackingCardProps {
  employee: Employee;
  sicknessScheme: SicknessScheme | null;
  isAdmin: boolean;
}

export const SicknessTrackingCard = ({
  employee,
  sicknessScheme,
  isAdmin
}: SicknessTrackingCardProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SicknessRecord | null>(null);
  const [entitlementSummary, setEntitlementSummary] = useState<SicknessEntitlementSummary | null>(null);
  const [workPattern, setWorkPattern] = useState<WorkDay[]>([]);

  const {
    sicknessRecords,
    entitlementUsage,
    loading,
    fetchSicknessData,
    calculateEntitlementSummary,
    addSicknessRecord,
    updateSicknessRecord,
    deleteSicknessRecord
  } = useSicknessData(employee, sicknessScheme);

  // Fetch work pattern
  useEffect(() => {
    const loadWorkPattern = async () => {
      if (employee?.id) {
        try {
          const patterns = await fetchWorkPatterns(employee.id);
          setWorkPattern(patterns);
        } catch (error) {
          console.error('Error loading work pattern:', error);
        }
      }
    };
    loadWorkPattern();
  }, [employee?.id]);

  useEffect(() => {
    const loadSummary = async () => {
      const summary = await calculateEntitlementSummary();
      setEntitlementSummary(summary);
    };
    
    if (entitlementUsage) {
      loadSummary();
    }
  }, [entitlementUsage, sicknessRecords]);

  const handleAddRecord = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEditRecord = (record: SicknessRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this sickness record?')) {
      await deleteSicknessRecord(id);
    }
  };

  const handleSaveRecord = async (recordData: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingRecord) {
      await updateSicknessRecord(editingRecord.id, recordData);
    } else {
      await addSicknessRecord(recordData);
    }
  };


  if (!sicknessScheme) {
    return (
      <Card className="border-[1.5px] border-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sickness Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sickness scheme assigned to this employee</p>
            <p className="text-sm mt-2">
              Assign a sickness scheme to track entitlements and absences
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[1.5px] border-foreground">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sickness Tracking
          </div>
          <SicknessReportPDFButton
            employee={employee}
            sicknessRecords={sicknessRecords}
            entitlementSummary={entitlementSummary}
            disabled={loading}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="entitlement" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entitlement">Entitlement</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          <TabsContent value="entitlement">
            <SicknessEntitlementCard 
              summary={entitlementSummary} 
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="records">
            <SicknessRecordsList
              records={sicknessRecords}
              loading={loading}
              isAdmin={isAdmin}
              workPattern={workPattern}
              employeeId={employee.id}
              onAddRecord={handleAddRecord}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onRecordsUpdated={fetchSicknessData}
            />
          </TabsContent>
        </Tabs>

        <SicknessRecordForm
          open={formOpen}
          onOpenChange={setFormOpen}
          record={editingRecord}
          employeeId={employee.id}
          companyId={employee.company_id || ''}
          onSave={handleSaveRecord}
        />

      </CardContent>
    </Card>
  );
};
