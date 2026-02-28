import { Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NicThresholdsGrid } from "./NicThresholdsGrid";
import { NicRatesGrid } from "./NicRatesGrid";

interface NicBandsManagerProps {
  taxYear: string;
}

export function NicBandsManager({ taxYear }: NicBandsManagerProps) {
  if (!taxYear) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["thresholds", "employee-rates", "employer-rates"]} className="space-y-3">
        <AccordionItem value="thresholds" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">National Insurance Thresholds</AccordionTrigger>
          <AccordionContent>
            <NicThresholdsGrid taxYear={taxYear} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="employee-rates" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">Employee Contribution Rates</AccordionTrigger>
          <AccordionContent>
            <NicRatesGrid taxYear={taxYear} contributionType="Employee" />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="employer-rates" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold">Employer Contribution Rates</AccordionTrigger>
          <AccordionContent>
            <NicRatesGrid taxYear={taxYear} contributionType="Employer" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
