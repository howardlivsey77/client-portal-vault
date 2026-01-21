import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";
import { toast } from "sonner";
import type { CompanyHoliday, CompanyHolidaySettings } from "../types/companyHoliday";

export function useCompanyHolidays() {
  const { currentCompany } = useCompany();
  
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [settings, setSettings] = useState<CompanyHolidaySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = useCallback(async () => {
    if (!currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("company_holidays")
        .select("*")
        .eq("company_id", currentCompany.id)
        .order("date", { ascending: true });
      
      if (error) throw error;
      setHolidays(data ?? []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  }, [currentCompany?.id]);

  const fetchSettings = useCallback(async () => {
    if (!currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("company_holiday_settings")
        .select("*")
        .eq("company_id", currentCompany.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no settings exist, use defaults
      setSettings(data ?? {
        use_uk_bank_holidays: true,
        bank_holiday_rate: 3,
      });
    } catch (error) {
      console.error("Error fetching holiday settings:", error);
    }
  }, [currentCompany?.id]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchHolidays(), fetchSettings()]);
    setLoading(false);
  }, [fetchHolidays, fetchSettings]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSettings = async (newSettings: Partial<CompanyHolidaySettings>) => {
    if (!currentCompany?.id) return;
    
    try {
      const { error } = await supabase
        .from("company_holiday_settings")
        .upsert({
          company_id: currentCompany.id,
          use_uk_bank_holidays: newSettings.use_uk_bank_holidays ?? settings?.use_uk_bank_holidays ?? true,
          bank_holiday_rate: newSettings.bank_holiday_rate ?? settings?.bank_holiday_rate ?? 3,
        }, {
          onConflict: "company_id",
        });
      
      if (error) throw error;
      
      await fetchSettings();
      toast.success("Holiday settings have been updated.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save holiday settings.");
    }
  };

  const addHoliday = async (holiday: Omit<CompanyHoliday, "id" | "company_id">) => {
    if (!currentCompany?.id) return;
    
    try {
      const { error } = await supabase
        .from("company_holidays")
        .insert({
          company_id: currentCompany.id,
          name: holiday.name,
          date: holiday.date,
          rate_override: holiday.rate_override,
          all_day: holiday.all_day,
          time_from: holiday.time_from,
          time_to: holiday.time_to,
          is_recurring: holiday.is_recurring,
        });
      
      if (error) {
        if (error.code === "23505") {
          toast.error("A holiday already exists for this date.");
          return;
        }
        throw error;
      }
      
      await fetchHolidays();
      toast.success(`${holiday.name} has been added.`);
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error("Failed to add holiday.");
    }
  };

  const updateHoliday = async (id: string, updates: Partial<CompanyHoliday>) => {
    try {
      const { error } = await supabase
        .from("company_holidays")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
      
      await fetchHolidays();
      toast.success("The holiday has been updated.");
    } catch (error) {
      console.error("Error updating holiday:", error);
      toast.error("Failed to update holiday.");
    }
  };

  const deleteHoliday = async (id: string) => {
    try {
      const { error } = await supabase
        .from("company_holidays")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      await fetchHolidays();
      toast.success("The holiday has been removed.");
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error("Failed to delete holiday.");
    }
  };

  return {
    holidays,
    settings,
    loading,
    refresh,
    saveSettings,
    addHoliday,
    updateHoliday,
    deleteHoliday,
  };
}
