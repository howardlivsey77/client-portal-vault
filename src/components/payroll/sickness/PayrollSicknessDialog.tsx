import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Activity, X } from 'lucide-react';
import { SicknessItem, SSP_DAILY_RATE } from '../adjustments/types';
import { SicknessEntitlementCard } from '@/components/employees/details/sickness/SicknessEntitlementCard';
import { SicknessRecordsList } from '@/components/employees/details/sickness/SicknessRecordsList';
import { SicknessRecordForm } from '@/components/employees/details/sickness/SicknessRecordForm';
import { SspSummaryPanel } from './SspSummaryPanel';
import { usePayrollSicknessData, PayPeriodFilter } from './usePayrollSicknessData';
import { SicknessRecord } from '@/types';

interface PayrollSicknessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  companyId: string;
  payPeriod?: PayPeriodFilter;
  initialItems: SicknessItem[];
  onSave: (items: SicknessItem[]) => void;
}

export function PayrollSicknessDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  companyId,
  payPeriod,
  initialItems,
  onSave,
}: PayrollSicknessDialogProps) {
  const [sspItems, setSspItems] = useState<SicknessItem[]>(initialItems);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SicknessRecord | null>(null);

  const {
    employee,
    sicknessScheme,
    sicknessRecords,
    entitlementSummary,
    workPattern,
    loading,
    fetchData,
    addSicknessRecord,
    updateSicknessRecord,
    deleteSicknessRecord
  } = usePayrollSicknessData(open ? employeeId : null, payPeriod);

  useEffect(() => {
    if (open) {
      setSspItems(initialItems.length > 0 ? initialItems : []);
    }
  }, [open, initialItems]);

  // Auto-calculate SSP from sickness records when records change
  useEffect(() => {
    if (sicknessRecords.length > 0) {
      // Calculate SSP based on sickness records
      // For simplicity, sum up qualifying days from records (accounting for 3-day waiting period)
      let totalQualifyingDays = 0;
      
      sicknessRecords.forEach(record => {
        // First 3 days of each sickness period are waiting days (no SSP)
        const qualifyingDays = Math.max(0, record.total_days - 3);
        totalQualifyingDays += qualifyingDays;
      });

      if (totalQualifyingDays > 0) {
        const calculatedItem: SicknessItem = {
          id: 'auto-calculated',
          daysQualifying: totalQualifyingDays,
          sspDailyRate: SSP_DAILY_RATE,
          amount: totalQualifyingDays * SSP_DAILY_RATE
        };
        setSspItems([calculatedItem]);
      }
    }
  }, [sicknessRecords]);

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
    setFormOpen(false);
  };

  const handleSave = () => {
    onSave(sspItems);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sickness & SSP - {employeeName}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {!sicknessScheme && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sickness scheme assigned to this employee</p>
              <p className="text-sm mt-2">
                Assign a sickness scheme in the employee details to track entitlements
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs defaultValue="records" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="records">Records</TabsTrigger>
                  <TabsTrigger value="entitlement">Entitlement</TabsTrigger>
                </TabsList>

                <TabsContent value="records" className="space-y-4">
                  <SicknessRecordsList
                    records={sicknessRecords}
                    loading={loading}
                    isAdmin={true}
                    workPattern={workPattern}
                    employeeId={employeeId}
                    onAddRecord={handleAddRecord}
                    onEditRecord={handleEditRecord}
                    onDeleteRecord={handleDeleteRecord}
                    onRecordsUpdated={fetchData}
                  />
                </TabsContent>

                <TabsContent value="entitlement">
                  <SicknessEntitlementCard
                    summary={entitlementSummary}
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>

              {/* SSP Summary Panel */}
              <SspSummaryPanel items={sspItems} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save SSP to Payroll</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sickness Record Form */}
      {employee && (
        <SicknessRecordForm
          open={formOpen}
          onOpenChange={setFormOpen}
          record={editingRecord}
          employeeId={employeeId}
          companyId={companyId}
          onSave={handleSaveRecord}
        />
      )}
    </>
  );
}
