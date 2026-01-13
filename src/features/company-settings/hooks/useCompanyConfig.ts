import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";

export interface UseCompanyConfigOptions<T> {
  tableName: string;
  selectColumns: string;
  transformFromDb: (data: any) => T;
  transformToDb: (item: T) => Record<string, any>;
  entityName: string;
}

export interface UseCompanyConfigResult<T> {
  items: T[];
  loading: boolean;
  fetch: () => Promise<void>;
  save: (item: T) => Promise<{ success: boolean; message: string }>;
  delete: (itemId: string) => Promise<{ success: boolean; message: string }>;
  refresh: () => Promise<void>;
}

export function useCompanyConfig<T extends { id?: string; name: string }>(
  options: UseCompanyConfigOptions<T>
): UseCompanyConfigResult<T> {
  const { tableName, selectColumns, transformFromDb, transformToDb, entityName } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!currentCompany?.id) {
        console.log(`No current company selected for ${entityName}`);
        setItems([]);
        return;
      }

      const { data, error } = await (supabase
        .from(tableName as any)
        .select(selectColumns)
        .eq('company_id', currentCompany.id) as any);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const transformedData = data.map((item: any) => transformFromDb(item));
        setItems(transformedData);
      }
    } catch (error: any) {
      console.error(`Error fetching ${entityName}:`, error.message);
      toast.error(`Error loading ${entityName}`, {
        description: `There was a problem loading ${entityName}. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, tableName, selectColumns, transformFromDb, entityName]);

  const saveItem = async (item: T): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentCompany?.id) {
        return { 
          success: false, 
          message: "No company selected. Please select a company first."
        };
      }

      const dbData = transformToDb(item);

      if (item.id) {
        // Update existing item
        const { error } = await (supabase
          .from(tableName as any)
          .update(dbData)
          .eq('id', item.id)
          .eq('company_id', currentCompany.id) as any);
          
        if (error) throw error;
        
        setItems(items.map(i => (i as any).id === item.id ? item : i));
        return { success: true, message: `${item.name} has been updated successfully.` };
      } else {
        // Add new item
        const { data, error } = await (supabase
          .from(tableName as any)
          .insert({ 
            ...dbData,
            company_id: currentCompany.id 
          })
          .select() as any);
          
        if (error) throw error;
        
        if (data && data[0]) {
          const newItem = transformFromDb(data[0]);
          setItems([...items, newItem]);
          return { success: true, message: `${item.name} has been added successfully.` };
        }
      }
      return { success: false, message: "Operation completed but with unexpected results." };
    } catch (error: any) {
      console.error(`Error saving ${entityName}:`, error.message, error.code);
      
      // Handle unique constraint violation (duplicate name)
      if (error.code === '23505') {
        return { 
          success: false, 
          message: `A configuration named "${item.name}" already exists. Please use a different name.`
        };
      }
      
      return { 
        success: false, 
        message: `There was a problem saving the ${entityName}. Please try again.`
      };
    }
  };

  const deleteItem = async (itemId: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!currentCompany?.id) {
        return { success: false, message: "No company selected." };
      }

      const { error } = await (supabase
        .from(tableName as any)
        .delete()
        .eq('id', itemId)
        .eq('company_id', currentCompany.id) as any);

      if (error) throw error;

      setItems(items.filter(i => (i as any).id !== itemId));
      return { success: true, message: `${entityName} deleted successfully.` };
    } catch (error: any) {
      console.error(`Error deleting ${entityName}:`, error.message);
      return { success: false, message: `Failed to delete ${entityName}.` };
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    fetch: fetchItems,
    save: saveItem,
    delete: deleteItem,
    refresh: fetchItems
  };
}
