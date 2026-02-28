import { useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PayrollConstantsManager,
  NicBandsManager,
  NhsPensionBandsManager,
  TaxBandsManager,
  StudentLoansManager,
} from "@/components/financial-data";
import { TaxYearSelector } from "@/components/financial-data/TaxYearSelector";
import { CopyTaxYearDialog } from "@/components/financial-data/CopyTaxYearDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function useDistinctTaxYears() {
  return useQuery({
    queryKey: ["tax-years-distinct"],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from("payroll_constants").select("tax_year").not("tax_year", "is", null),
        supabase.from("nic_bands").select("tax_year"),
        supabase.from("nhs_pension_bands").select("tax_year"),
        supabase.from("tax_bands").select("tax_year"),
      ]);
      const years = new Set<string>();
      for (const { data } of results) {
        if (data) for (const row of data) if ((row as any).tax_year) years.add((row as any).tax_year);
      }
      return Array.from(years).sort().reverse();
    },
  });
}

export default function FinancialData() {
  const [selectedYear, setSelectedYear] = useState("");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const { data: years = [] } = useDistinctTaxYears();

  const handleYearCreated = useCallback((newYear: string) => {
    setSelectedYear(newYear);
  }, []);

  return (
    <PageContainer title="Financial Data">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Data</h1>
            <p className="text-muted-foreground">
              Manage payroll constants, NIC bands, NHS pension bands, and tax bands.
            </p>
          </div>
          <TaxYearSelector
            selected={selectedYear}
            onChange={setSelectedYear}
            onAddYear={() => setCopyDialogOpen(true)}
          />
        </div>

        {selectedYear && (
          <Tabs defaultValue="nic-bands" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="nic-bands">NIC Bands</TabsTrigger>
              <TabsTrigger value="tax-bands">Tax Bands</TabsTrigger>
              <TabsTrigger value="student-loans">Student Loans</TabsTrigger>
              <TabsTrigger value="nhs-pension">NHS Pension Bands</TabsTrigger>
              <TabsTrigger value="general-constants">General Constants</TabsTrigger>
            </TabsList>
            <TabsContent value="nic-bands">
              <NicBandsManager taxYear={selectedYear} />
            </TabsContent>
            <TabsContent value="tax-bands">
              <TaxBandsManager taxYear={selectedYear} />
            </TabsContent>
            <TabsContent value="student-loans">
              <StudentLoansManager taxYear={selectedYear} />
            </TabsContent>
            <TabsContent value="nhs-pension">
              <NhsPensionBandsManager taxYear={selectedYear} />
            </TabsContent>
            <TabsContent value="general-constants">
              <PayrollConstantsManager taxYear={selectedYear} />
            </TabsContent>
          </Tabs>
        )}

        {!selectedYear && (
          <p className="text-muted-foreground text-center py-12">Select a tax year to view financial data, or add a new one.</p>
        )}

        <CopyTaxYearDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          existingYears={years}
          onCreated={handleYearCreated}
        />
      </div>
    </PageContainer>
  );
}
