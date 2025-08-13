
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SicknessEntitlementCard } from "./SicknessEntitlementCard";
import { SicknessRecordsList } from "./SicknessRecordsList";
import { SicknessRecordForm } from "./SicknessRecordForm";
import { OpeningBalanceDialog } from "./OpeningBalanceDialog";
import { useSicknessData } from "@/hooks/useSicknessData";
import { SicknessRecord, SicknessEntitlementSummary, OpeningBalanceData } from "@/types/sickness";
import { SicknessScheme } from "@/components/employees/details/work-pattern/types";
import { Employee } from "@/types/employee-types";
import { Activity, AlertCircle } from "lucide-react";
import { SicknessReportPDFButton } from "./SicknessReportPDFButton";

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
  const [openingBalanceDialogOpen, setOpeningBalanceDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SicknessRecord | null>(null);
  const [entitlementSummary, setEntitlementSummary] = useState<SicknessEntitlementSummary | null>(null);

  const {
    sicknessRecords,
    entitlementUsage,
    loading,
    calculateEntitlementSummary,
    setOpeningBalance,
    addSicknessRecord,
    updateSicknessRecord,
    deleteSicknessRecord
  } = useSicknessData(employee, sicknessScheme);

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

  const handleSetOpeningBalance = () => {
    setOpeningBalanceDialogOpen(true);
  };

  const handleSaveOpeningBalance = async (data: OpeningBalanceData) => {
    await setOpeningBalance(data);
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
              isAdmin={isAdmin}
              onSetOpeningBalance={handleSetOpeningBalance}
            />
          </TabsContent>

          <TabsContent value="records">
            <SicknessRecordsList
              records={sicknessRecords}
              loading={loading}
              isAdmin={isAdmin}
              onAddRecord={handleAddRecord}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
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

        <OpeningBalanceDialog
          open={openingBalanceDialogOpen}
          onOpenChange={setOpeningBalanceDialogOpen}
          currentBalance={{
            full_pay: entitlementUsage?.opening_balance_full_pay || 0,
            half_pay: entitlementUsage?.opening_balance_half_pay || 0,
            date: entitlementUsage?.opening_balance_date || '',
            notes: entitlementUsage?.opening_balance_notes || ''
          }}
          onSave={handleSaveOpeningBalance}
        />
      </CardContent>
    </Card>
  );
};
