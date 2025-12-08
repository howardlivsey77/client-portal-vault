
import { useState, useEffect } from "react";
import { documentFolderService } from "@/services";
import { useCompany } from "@/providers/CompanyProvider";
import { toast } from "@/hooks/use-toast";

export function useSubfolders(selectedFolderId: string | null) {
  const { currentCompany } = useCompany();
  const [subfolders, setSubfolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubfolders();
  }, [currentCompany?.id, selectedFolderId]);

  const loadSubfolders = async () => {
    if (!currentCompany?.id || !selectedFolderId) {
      setSubfolders([]);
      return;
    }

    setLoading(true);
    try {
      const allFolders = await documentFolderService.getFolders(currentCompany.id);
      const childFolders = allFolders.filter(folder => folder.parent_id === selectedFolderId);
      setSubfolders(childFolders);
    } catch (error) {
      console.error('Error loading subfolders:', error);
      toast({
        title: "Error loading subfolders",
        description: "Failed to load subfolders",
        variant: "destructive"
      });
      setSubfolders([]);
    } finally {
      setLoading(false);
    }
  };

  return subfolders;
}
