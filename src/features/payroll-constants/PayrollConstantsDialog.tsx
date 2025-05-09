
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";
import { supabase } from "@/integrations/supabase/client";
import { PayrollConstantsTable } from "./PayrollConstantsTable";
import { PayrollConstantForm } from "./PayrollConstantForm";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Filter } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

  const categories = [
    { id: "TAX_BANDS", name: "Tax Bands" },
    { id: "NI_THRESHOLDS", name: "NI Thresholds" },
    { id: "NI_RATES", name: "NI Rates" },
    { id: "STUDENT_LOAN", name: "Student Loan" }
  ];

  useEffect(() => {
    if (open) {
      loadConstants(activeCategory);
    }
  }, [open, activeCategory, showHistorical]);

  const loadConstants = async (category: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("payroll_constants")
        .select("*")
        .eq("category", category)
        .order("key");
      
      // Only filter by is_current if we're not showing historical data
      if (!showHistorical) {
        query = query.eq("is_current", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConstants(data || []);
    } catch (error) {
      console.error("Error loading constants:", error);
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
      const { error } = await supabase
        .from("payroll_constants")
        .delete()
        .eq("id", deletingConstant.id);
      
      if (error) throw error;
      
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
      let response;
      if (editingConstant) {
        // Update existing constant
        response = await supabase
          .from("payroll_constants")
          .update({
            key: constant.key,
            value_numeric: constant.value_numeric,
            value_text: constant.value_text,
            description: constant.description,
            region: constant.region,
            effective_from: constant.effective_from,
            effective_to: constant.effective_to,
          })
          .eq("id", editingConstant.id);
      } else {
        // Insert new constant
        response = await supabase
          .from("payroll_constants")
          .insert({
            category: activeCategory,
            key: constant.key,
            value_numeric: constant.value_numeric,
            value_text: constant.value_text,
            description: constant.description,
            region: constant.region || 'UK',
            effective_from: constant.effective_from || new Date().toISOString(),
            is_current: true,
          });
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: editingConstant ? "Constant updated" : "Constant added",
        description: `"${constant.key}" has been ${editingConstant ? "updated" : "added"} successfully.`,
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Payroll Constants</DialogTitle>
          </DialogHeader>
          
          <Tabs 
            value={activeCategory} 
            onValueChange={handleTabChange}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid grid-cols-4">
              {categories.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(category => (
              <TabsContent 
                key={category.id} 
                value={category.id}
                className="flex-1 flex flex-col"
              >
                {showForm ? (
                  <PayrollConstantForm 
                    constant={editingConstant}
                    category={activeCategory}
                    onSave={handleSave}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingConstant(null);
                    }}
                  />
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="mb-4 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="show-historical" 
                          checked={showHistorical} 
                          onCheckedChange={setShowHistorical}
                        />
                        <label htmlFor="show-historical" className="text-sm cursor-pointer flex items-center gap-1">
                          <Filter className="h-4 w-4" /> Show historical records
                        </label>
                      </div>
                      <Button onClick={handleAddNew}>Add New Constant</Button>
                    </div>
                    
                    {loading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <PayrollConstantsTable 
                        constants={constants} 
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the constant "{deletingConstant?.key}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
