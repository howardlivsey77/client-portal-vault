import { ProcessedSicknessRecord } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertTriangle, Split, ArrowRight } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useBrandColors } from "@/brand";

interface FinalReviewViewProps {
  records: ProcessedSicknessRecord[];
  onImport: () => void;
  onBack: () => void;
  isImporting: boolean;
}

export const FinalReviewView = ({ records, onImport, onBack, isImporting }: FinalReviewViewProps) => {
  const brandColors = useBrandColors();
  
  // Filter out fully overlapping (skipped) records
  const recordsToImport = records.filter(r => r.trimStatus !== 'fully_overlapping');
  
  // Calculate statistics
  const stats = {
    total: recordsToImport.length,
    trimmed: recordsToImport.filter(r => r.trimStatus === 'trimmed').length,
    split: recordsToImport.filter(r => r.trimStatus === 'split').length,
    skipped: records.filter(r => r.trimStatus === 'fully_overlapping').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Final Review</h2>
        <p className="text-muted-foreground mt-1">
          Review all records before importing
        </p>
      </div>

      {/* Summary Card */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
          <CardDescription>Ready to import the following records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total to Import</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Records Trimmed</p>
              <p className="text-2xl font-bold text-amber-600">{stats.trimmed}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Split Records</p>
              <p className="text-2xl font-bold" style={{ color: `hsl(${brandColors.info})` }}>{stats.split}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Skipped (Full Overlap)</p>
              <p className="text-2xl font-bold text-destructive">{stats.skipped}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records to Import */}
      <Card>
        <CardHeader>
          <CardTitle>Records to Import ({recordsToImport.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Scheme</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsToImport.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                    <TableCell>
                      {record.startDate} <ArrowRight className="inline h-3 w-3 mx-1" /> {record.endDate}
                    </TableCell>
                    <TableCell>{record.sicknessDays || 0} days</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.matchedSchemeName || record.schemeAllocation || 'Default'}
                    </TableCell>
                    <TableCell>
                      {record.trimStatus === 'no_overlap' && (
                        <Badge 
                          variant="outline" 
                          style={{
                            backgroundColor: `hsl(${brandColors.successLight})`,
                            color: `hsl(${brandColors.success})`,
                            borderColor: `hsl(${brandColors.success} / 0.3)`
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Original
                        </Badge>
                      )}
                      {record.trimStatus === 'trimmed' && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Trimmed
                        </Badge>
                      )}
                      {record.trimStatus === 'split' && (
                        <Badge 
                          variant="outline"
                          style={{
                            backgroundColor: `hsl(${brandColors.infoLight})`,
                            color: `hsl(${brandColors.info})`,
                            borderColor: `hsl(${brandColors.info} / 0.3)`
                          }}
                        >
                          <Split className="h-3 w-3 mr-1" />
                          Split
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          Back to Overlap Review
        </Button>
        <Button onClick={onImport} disabled={isImporting || recordsToImport.length === 0}>
          {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isImporting ? 'Importing...' : `Import ${recordsToImport.length} Record${recordsToImport.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};
