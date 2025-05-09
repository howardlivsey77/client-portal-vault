
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";
import { useToast } from "@/hooks/use-toast";
import { ConstantsTabContent } from "./ConstantsTabContent";
import { DeleteConstantDialog } from "./DeleteConstantDialog";
import { PAYROLL_CATEGORIES } from "./constants";
import { fetchConstants, saveConstant, deleteConstant } from "./payroll-constants-service";

interface PayrollConstantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayrollConstantsDialog({ open, onOpenChange }: PayrollConstantsDialogProps) {
  const [activeCategory, setActiveCategory] = useState<string>("TAX_BANDS");
  const [constants, setConstants] = useState<TaxConstant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConstant, setEditingConstant] = useState<TaxConstant | null>(null);
  const [deletingConstant, setDeletingConstant] = useState<TaxConstant | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadConstants(activeCategory);
    }
  }, [open, activeCategory, showHistorical]);

  const loadConstants = async (category: string) => {
    setLoading(true);
    try {
      const data = await fetchConstants(category, showHistorical);
      setConstants(data);
    } catch (error) {
      toast({
        title: "Error loading constants",
        description: "Could not load payroll constants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (category: string) => {
    setActiveCategory(category);
    setEditingConstant(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    setEditingConstant(null);
    setShowForm(true);
  };

  const handleEdit = (constant: TaxConstant) => {
    setEditingConstant(constant);
    setShowForm(true);
  };

  const handleDelete = (constant: TaxConstant) => {
    setDeletingConstant(constant);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingConstant) return;
    
    try {
      await deleteConstant(deletingConstant.id);
      
      toast({
        title: "Constant deleted",
        description: `"${deletingConstant.key}" has been deleted successfully.`,
      });
      
      // Refresh the constants list
      loadConstants(activeCategory);
    } catch (error) {
      console.error("Error deleting constant:", error);
      toast({
        title: "Error deleting constant",
        description: "Could not delete the constant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletingConstant(null);
    }
  };

  const handleSave = async (constant: Partial<TaxConstant>) => {
    try {
      const action = await saveConstant(constant, editingConstant);
      
      toast({
        title: editingConstant ? "Constant updated" : "Constant added",
        description: `"${constant.key}" has been ${action} successfully.`,
      });
      
      // Refresh the constants list and exit form mode
      loadConstants(activeCategory);
      setShowForm(false);
      setEditingConstant(null);
    } catch (error) {
      console.error("Error saving constant:", error);
      toast({
        title: "Error saving constant",
        description: "Could not save the constant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingConstant(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Manage Payroll Constants</DialogTitle>
          </DialogHeader>
          
          <Tabs 
            value={activeCategory} 
            onValueChange={handleTabChange}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid grid-cols-4">
              {PAYROLL_CATEGORIES.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {PAYROLL_CATEGORIES.map(category => (
              <TabsContent 
                key={category.id} 
                value={category.id}
                className="flex-1 flex flex-col overflow-hidden mt-0 pt-4 border-t"
              >
                <ConstantsTabContent 
                  loading={loading}
                  showForm={showForm}
                  editingConstant={editingConstant}
                  constants={constants}
                  activeCategory={activeCategory}
                  showHistorical={showHistorical}
                  setShowHistorical={setShowHistorical}
                  onAddNew={handleAddNew}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSave={handleSave}
                  onCancelForm={handleCancelForm}
                />
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <DeleteConstantDialog 
        deletingConstant={deletingConstant}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
}
