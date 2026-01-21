import { useState, useEffect, useCallback } from "react";
import { useCompany } from "@/providers";
import { useToast } from "@/hooks/common/use-toast";
import {
  CostCentre,
  CreateCostCentreData,
  UpdateCostCentreData,
  fetchCostCentresByCompany,
  createCostCentre,
  updateCostCentre,
  deleteCostCentre,
} from "@/services/employees/costCentreService";

export function useCostCentres() {
  const [costCentres, setCostCentres] = useState<CostCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();
  const { toast } = useToast();

  const fetchCostCentres = useCallback(async () => {
    if (!currentCompany?.id) {
      setCostCentres([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchCostCentresByCompany(currentCompany.id);
      setCostCentres(data);
    } catch (error) {
      console.error("Error fetching cost centres:", error);
      toast({
        title: "Error",
        description: "Failed to load cost centres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, toast]);

  const addCostCentre = async (costCentreData: Omit<CreateCostCentreData, 'company_id'>) => {
    if (!currentCompany?.id) {
      toast({
        title: "Error",
        description: "No company selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCostCentre = await createCostCentre({
        ...costCentreData,
        company_id: currentCompany.id,
      });
      setCostCentres((prev) => [...prev, newCostCentre].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Success",
        description: "Cost centre added successfully",
      });
      return newCostCentre;
    } catch (error) {
      console.error("Error adding cost centre:", error);
      toast({
        title: "Error",
        description: "Failed to add cost centre",
        variant: "destructive",
      });
      throw error;
    }
  };

  const editCostCentre = async (costCentreId: string, updateData: UpdateCostCentreData) => {
    try {
      const updatedCostCentre = await updateCostCentre(costCentreId, updateData);
      setCostCentres((prev) =>
        prev.map((cc) => (cc.id === costCentreId ? updatedCostCentre : cc))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({
        title: "Success",
        description: "Cost centre updated successfully",
      });
      return updatedCostCentre;
    } catch (error) {
      console.error("Error updating cost centre:", error);
      toast({
        title: "Error",
        description: "Failed to update cost centre",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeCostCentre = async (costCentreId: string) => {
    try {
      await deleteCostCentre(costCentreId);
      setCostCentres((prev) => prev.filter((cc) => cc.id !== costCentreId));
      toast({
        title: "Success",
        description: "Cost centre deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting cost centre:", error);
      toast({
        title: "Error",
        description: "Failed to delete cost centre",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCostCentres();
  }, [fetchCostCentres]);

  const costCentreNames = costCentres.map((cc) => cc.name);

  return {
    costCentres,
    costCentreNames,
    loading,
    fetchCostCentres,
    addCostCentre,
    editCostCentre,
    removeCostCentre,
  };
}
