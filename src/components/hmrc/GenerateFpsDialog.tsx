import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGenerateFps } from "@/hooks/hmrc/useGenerateFps";
import { useCompany } from "@/providers";
import { useToast } from "@/hooks";
import { Loader2, Download, FileText, CheckCircle2 } from "lucide-react";

const PERIOD_LABELS = [
  "Period 1 (Apr)", "Period 2 (May)", "Period 3 (Jun)",
  "Period 4 (Jul)", "Period 5 (Aug)", "Period 6 (Sep)",
  "Period 7 (Oct)", "Period 8 (Nov)", "Period 9 (Dec)",
  "Period 10 (Jan)", "Period 11 (Feb)", "Period 12 (Mar)",
];

function generateFinancialYears(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const fy = now.getMonth() >= 3 ? year : year - 1;
  return [
    `${fy - 1}/${fy.toString().slice(-2)}`,
    `${fy}/${(fy + 1).toString().slice(-2)}`,
    `${fy + 1}/${(fy + 2).toString().slice(-2)}`,
  ];
}

interface GenerateFpsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTaxYear?: string;
}

export function GenerateFpsDialog({ open, onOpenChange, defaultTaxYear }: GenerateFpsDialogProps) {
  const financialYears = useMemo(() => generateFinancialYears(), []);
  const [taxYear, setTaxYear] = useState(defaultTaxYear || financialYears[1]);
  const [taxPeriod, setTaxPeriod] = useState<string>("1");
  const [finalSubmission, setFinalSubmission] = useState(false);

  const { generate, isLoading, result, reset } = useGenerateFps();
  const { currentCompany } = useCompany();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!currentCompany?.id) {
      toast({ title: "Error", description: "No company selected", variant: "destructive" });
      return;
    }

    try {
      await generate({
        companyId: currentCompany.id,
        taxYear,
        taxPeriod: parseInt(taxPeriod),
        finalSubmission,
      });
      toast({ title: "FPS Generated", description: "XML file generated successfully." });
    } catch (err: any) {
      toast({
        title: "FPS Generation Failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!result?.xml) return;
    const blob = new Blob([result.xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FPS_${taxYear.replace("/", "-")}_P${taxPeriod}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate FPS XML
          </DialogTitle>
          <DialogDescription>
            Generate a Full Payment Submission XML file for HMRC RTI.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fps-tax-year">Tax Year</Label>
                <Select value={taxYear} onValueChange={setTaxYear}>
                  <SelectTrigger id="fps-tax-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {financialYears.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fps-tax-period">Tax Period</Label>
                <Select value={taxPeriod} onValueChange={setTaxPeriod}>
                  <SelectTrigger id="fps-tax-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_LABELS.map((label, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="fps-final"
                checked={finalSubmission}
                onCheckedChange={(checked) => setFinalSubmission(checked === true)}
              />
              <Label htmlFor="fps-final" className="text-sm cursor-pointer">
                Final submission for this tax year
              </Label>
            </div>

            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate FPS"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>
                Generated for <strong>{result.employeeCount}</strong> employee{result.employeeCount !== 1 ? "s" : ""} — {result.taxYear} Period {result.taxPeriod} — {new Date(result.generatedAt).toLocaleString()}
              </span>
            </div>

            <ScrollArea className="flex-1 min-h-0 max-h-[40vh] rounded-md border">
              <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
                {result.xml}
              </pre>
            </ScrollArea>

            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download XML
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
