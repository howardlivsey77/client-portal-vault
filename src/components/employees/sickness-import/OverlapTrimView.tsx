import { ProcessedSicknessRecord } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, AlertTriangle, Split, XCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface OverlapTrimViewProps {
  records: ProcessedSicknessRecord[];
  onProceed: () => void;
  onBack: () => void;
}

export const OverlapTrimView = ({ records, onProceed, onBack }: OverlapTrimViewProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate statistics
  const stats = {
    total: records.length,
    noOverlap: records.filter(r => r.trimStatus === 'no_overlap').length,
    trimmed: records.filter(r => r.trimStatus === 'trimmed').length,
    split: records.filter(r => r.trimStatus === 'split').length,
    fullyOverlapping: records.filter(r => r.trimStatus === 'fully_overlapping').length
  };

  // Group split records by parent
  const groupedRecords = records.reduce((acc, record) => {
    if (record.parentRecordId) {
      if (!acc[record.parentRecordId]) {
        acc[record.parentRecordId] = [];
      }
      acc[record.parentRecordId].push(record);
    } else {
      acc[record.id] = [record];
    }
    return acc;
  }, {} as Record<string, ProcessedSicknessRecord[]>);

  const recordGroups = Object.values(groupedRecords);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overlap Detection & Auto-Trim</h2>
        <p className="text-muted-foreground mt-1">
          Reviewing imported records for overlaps with existing sickness data
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Records</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No Overlap
            </CardDescription>
            <CardTitle className="text-3xl text-primary">{stats.noOverlap}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Trimmed
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats.trimmed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Split className="h-4 w-4 text-blue-600" />
              Split
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.split}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              Skipped
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.fullyOverlapping}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Records Review</CardTitle>
          <CardDescription>
            Review auto-trimmed records before final import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Original Date Range</TableHead>
                  <TableHead>New Date Range(s)</TableHead>
                  <TableHead className="text-right">Working Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordGroups.map((group) => {
                  const mainRecord = group[0];
                  const hasDetails = mainRecord.wasTrimmed || mainRecord.trimStatus === 'split';
                  const isExpanded = expandedRows.has(mainRecord.id);

                  return (
                    <Collapsible key={mainRecord.id} open={isExpanded} asChild>
                      <>
                        <TableRow>
                          <TableCell>
                            {hasDetails && (
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRow(mainRecord.id)}
                                >
                                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </Button>
                              </CollapsibleTrigger>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{mainRecord.employeeName}</TableCell>
                          <TableCell>
                            {mainRecord.trimStatus === 'no_overlap' && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                No Overlap
                              </Badge>
                            )}
                            {mainRecord.trimStatus === 'trimmed' && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Trimmed
                              </Badge>
                            )}
                            {mainRecord.trimStatus === 'split' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Split className="h-3 w-3 mr-1" />
                                Split ({group.length})
                              </Badge>
                            )}
                            {mainRecord.trimStatus === 'fully_overlapping' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Skipped
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {mainRecord.trimmedFrom ? (
                              <span className="text-muted-foreground">
                                {mainRecord.trimmedFrom.originalStartDate} - {mainRecord.trimmedFrom.originalEndDate}
                              </span>
                            ) : (
                              <span>{mainRecord.startDate} - {mainRecord.endDate}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {mainRecord.trimStatus === 'fully_overlapping' ? (
                              <span className="text-muted-foreground italic">Fully overlapping</span>
                            ) : mainRecord.trimStatus === 'split' ? (
                              <span className="text-blue-600 font-medium">{group.length} new records</span>
                            ) : (
                              <span>{mainRecord.startDate} - {mainRecord.endDate}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {mainRecord.trimStatus === 'fully_overlapping' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : mainRecord.trimStatus === 'split' ? (
                              <span className="font-medium">
                                {group.reduce((sum, r) => sum + (r.sicknessDays || 0), 0)} days
                              </span>
                            ) : (
                              <span>{mainRecord.sicknessDays || 0} days</span>
                            )}
                          </TableCell>
                        </TableRow>
                        {hasDetails && (
                          <CollapsibleContent asChild>
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/50">
                                <div className="p-4 space-y-3">
                                  {mainRecord.trimmedFrom && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Original Record:</p>
                                      <p className="text-sm text-muted-foreground">
                                        {mainRecord.trimmedFrom.originalStartDate} - {mainRecord.trimmedFrom.originalEndDate} 
                                        ({mainRecord.trimmedFrom.originalSicknessDays} working days)
                                      </p>
                                    </div>
                                  )}
                                  {mainRecord.overlapDetails && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Conflicts with existing records:</p>
                                      <ul className="text-sm text-muted-foreground space-y-1">
                                        {mainRecord.overlapDetails.overlappingRecords.map((overlap) => (
                                          <li key={overlap.id}>
                                            • {overlap.start_date}{overlap.end_date ? ` - ${overlap.end_date}` : ''} ({overlap.total_days} days)
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {group.length > 1 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Auto-trimmed to {group.length} records:</p>
                                      <ul className="text-sm space-y-1">
                                        {group.map((record, idx) => (
                                          <li key={record.id} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-primary" />
                                            <span>
                                              {record.startDate} - {record.endDate} ({record.sicknessDays} working days)
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        )}
                      </>
                    </Collapsible>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Review
        </Button>
        <Button onClick={onProceed} disabled={stats.total === stats.fullyOverlapping}>
          Continue to Final Review
        </Button>
      </div>
    </div>
  );
};
