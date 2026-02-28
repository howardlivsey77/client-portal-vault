import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PayrollConstantsManager,
  NicBandsManager,
  NhsPensionBandsManager,
  TaxBandsManager,
} from "@/components/financial-data";

export default function FinancialData() {
  return (
    <PageContainer title="Financial Data">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Data</h1>
          <p className="text-muted-foreground">
            Manage payroll constants, NIC bands, NHS pension bands, and tax bands.
          </p>
        </div>
        <Tabs defaultValue="payroll-constants" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="payroll-constants">Payroll Constants</TabsTrigger>
            <TabsTrigger value="nic-bands">NIC Bands</TabsTrigger>
            <TabsTrigger value="nhs-pension">NHS Pension Bands</TabsTrigger>
            <TabsTrigger value="tax-bands">Tax Bands</TabsTrigger>
          </TabsList>
          <TabsContent value="payroll-constants">
            <PayrollConstantsManager />
          </TabsContent>
          <TabsContent value="nic-bands">
            <NicBandsManager />
          </TabsContent>
          <TabsContent value="nhs-pension">
            <NhsPensionBandsManager />
          </TabsContent>
          <TabsContent value="tax-bands">
            <TaxBandsManager />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
