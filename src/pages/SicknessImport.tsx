import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { readFileData } from "@/components/employees/import/fileParsingUtils";
import { useEmployees } from "@/hooks/useEmployees";
import Fuse from "fuse.js";
import { format, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { sicknessService } from "@/services/sicknessService";
import { useCompany } from "@/providers/CompanyProvider";

// Types for parsed import rows
interface RawRow {
  [key: string]: any;
}

interface Mapping {
  payrollId?: string;
  lastName?: string;
  firstName?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: string;
  pairs: { days?: string; type?: string }[]; // up to 3
}

interface ParsedRow {
  raw: RawRow;
  startDate: string | null; // ISO yyyy-MM-dd
  endDate: string | null;   // ISO yyyy-MM-dd
  totalDays: number;        // sum of full+half+ssp if not provided
  fullDays: number;
  halfDays: number;
  sspDays: number;
  nameGuess: { first?: string; last?: string; payroll?: string };
  mismatchTotal: boolean;
}

interface MatchResult {
  rowIndex: number;
  parsed: ParsedRow;
  matchedEmployeeId?: string;
  candidates: { id: string; payroll_id?: string | null; first_name: string; last_name: string; score: number }[];
}

function toISOFromDDMMYYYY(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Attempt DD/MM/YYYY
    try {
      const d = parse(trimmed, "dd/MM/yyyy", new Date());
      if (!isNaN(d.getTime())) return format(d, "yyyy-MM-dd");
    } catch {}
    // Fallback: if already ISO-like
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  }
  if (typeof value === "number") {
    // Excel serial not handled here; fileParsingUtils already normalizes strings usually
    return null;
  }
  return null;
}

function normalizeType(v: any): "full" | "half" | "ssp" | null {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();
  if (s.includes("full")) return "full";
  if (s.includes("half")) return "half";
  if (s.includes("ssp")) return "ssp";
  return null;
}

function isNumeric(n: any): boolean {
  if (n === null || n === undefined) return false;
  const num = Number(String(n).replace(/,/g, "."));
  return !isNaN(num);
}

function suggestMapping(headers: string[], sample: RawRow): Mapping {
  const lower = headers.map((h) => h.toLowerCase());
  const findHeader = (candidates: string[]) => {
    const idx = lower.findIndex((h) => candidates.some((c) => h.includes(c)));
    return idx >= 0 ? headers[idx] : undefined;
  };

  // Detect days/type pairs by adjacency heuristic
  const pairs: { days?: string; type?: string }[] = [];
  for (let i = 0; i < headers.length - 1 && pairs.length < 3; i++) {
    const left = headers[i];
    const right = headers[i + 1];
    const leftVal = sample[left];
    const rightVal = sample[right];
    const rightLooksType = /type|payment|pay/i.test(right) || normalizeType(rightVal) !== null;
    if (isNumeric(leftVal) && rightLooksType) {
      pairs.push({ days: left, type: right });
      i++; // skip next
    }
  }

  return {
    payrollId: findHeader(["payroll", "pay id", "pay-id", "employee number", "emp no"]),
    lastName: findHeader(["surname", "last", "family name"]),
    firstName: findHeader(["first", "forename", "given name"]),
    startDate: findHeader(["start", "from", "begin"]),
    endDate: findHeader(["end", "to", "finish"]),
    totalDays: findHeader(["total", "days absent", "absence days"]) ,
    pairs,
  };
}

export default function SicknessImport() {
  const { toast } = useToast();
  const { employees } = useEmployees();
  const { currentCompany } = useCompany();

  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<Mapping>({ pairs: [] });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [skipAllUnmatched, setSkipAllUnmatched] = useState(false);
  const [autoSkippedRows, setAutoSkippedRows] = useState<Set<number>>(new Set());

  // Build fuse over employees for fuzzy surname/firstname
  const fuse = useMemo(() => {
    return new Fuse(
      employees.map((e) => ({ ...e })),
      {
        includeScore: true,
        threshold: 0.3,
        keys: [
          { name: "last_name", weight: 0.7 },
          { name: "first_name", weight: 0.3 },
        ],
      }
    );
  }, [employees]);

  useEffect(() => {
    document.title = "Sickness Import | Employees";
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const f = e.target.files[0];
    setFileName(f.name);

    try {
      const { data, headers } = await readFileData(f);
      if (!data || data.length === 0) {
        toast({ title: "No data in file", variant: "destructive" });
        return;
      }
      setHeaders(headers);
      setRawRows(data as RawRow[]);
      const guess = suggestMapping(headers, data[0] as RawRow);
      setMapping(guess);
      toast({ title: "File loaded", description: `${data.length} rows detected` });
    } catch (err: any) {
      toast({ title: "Error reading file", description: err?.message ?? String(err), variant: "destructive" });
    }
  };

  const parseRows = () => {
    if (!rawRows.length) return;

    const rows: ParsedRow[] = rawRows.map((row) => {
      const sd = toISOFromDDMMYYYY(mapping.startDate ? row[mapping.startDate] : null);
      const ed = toISOFromDDMMYYYY(mapping.endDate ? row[mapping.endDate] : null);

      let full = 0, half = 0, ssp = 0;
      (mapping.pairs || []).forEach((p) => {
        if (!p.days || !p.type) return;
        const n = Number(String(row[p.days] ?? "").toString().replace(/,/g, "."));
        const t = normalizeType(row[p.type]);
        if (!isNaN(n) && n > 0 && t) {
          if (t === "full") full += n;
          else if (t === "half") half += n;
          else if (t === "ssp") ssp += n;
        }
      });

      const providedTotal = mapping.totalDays ? Number(row[mapping.totalDays] ?? 0) : 0;
      const computedTotal = full + half + ssp;

      const parsed: ParsedRow = {
        raw: row,
        startDate: sd,
        endDate: ed,
        totalDays: providedTotal > 0 ? providedTotal : computedTotal,
        fullDays: full,
        halfDays: half,
        sspDays: ssp,
        nameGuess: {
          payroll: mapping.payrollId ? String(row[mapping.payrollId] ?? "").trim() : undefined,
          first: mapping.firstName ? String(row[mapping.firstName] ?? "").trim() : undefined,
          last: mapping.lastName ? String(row[mapping.lastName] ?? "").trim() : undefined,
        },
        mismatchTotal: providedTotal > 0 && providedTotal !== computedTotal,
      };
      return parsed;
    });

    setParsedRows(rows);

    // Attempt matching
    const results: MatchResult[] = rows.map((parsed, idx) => {
      let matchedEmployeeId: string | undefined;
      let candidates: MatchResult["candidates"] = [];

      // 1) Payroll ID exact match
      const payroll = parsed.nameGuess.payroll?.toLowerCase();
      if (payroll) {
        const direct = employees.find(
          (e) => (e.payroll_id ?? "").toLowerCase() === payroll
        );
        if (direct) matchedEmployeeId = direct.id;
      }

      // 2) Fuzzy last + first if not matched
      if (!matchedEmployeeId) {
        const last = (parsed.nameGuess.last ?? "").toString();
        const first = (parsed.nameGuess.first ?? "").toString();
        const searchQuery = `${last} ${first}`.trim();
        if (searchQuery) {
          const res = fuse.search(searchQuery).slice(0, 5);
          candidates = res.map((r) => ({
            id: (r.item as any).id,
            payroll_id: (r.item as any).payroll_id,
            first_name: (r.item as any).first_name,
            last_name: (r.item as any).last_name,
            score: r.score ?? 1,
          }));
          if (res[0] && (res[0].score ?? 1) <= 0.2) {
            matchedEmployeeId = (res[0].item as any).id;
          }
        }
      }

      return { rowIndex: idx, parsed, matchedEmployeeId, candidates };
    });

    setMatchResults(results);
  };

  const updateCandidateSelection = (rowIndex: number, employeeId: string) => {
    setMatchResults((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, matchedEmployeeId: employeeId } : r)));
    setAutoSkippedRows((prev) => {
      const next = new Set(prev);
      if (employeeId === "__skip__") {
        next.add(rowIndex);
      } else {
        next.delete(rowIndex);
      }
      return next;
    });
  };

  const allMatched = useMemo(() => matchResults.length > 0 && matchResults.every((r) => !!r.matchedEmployeeId), [matchResults]);
  const anyMismatches = useMemo(() => parsedRows.some((r) => r.mismatchTotal), [parsedRows]);
  const unmatchedCount = useMemo(() => matchResults.filter((r) => !r.matchedEmployeeId).length, [matchResults]);

  const handleToggleSkipAllUnmatched = (checked: boolean) => {
    const isChecked = !!checked;
    setSkipAllUnmatched(isChecked);
    if (isChecked) {
      setMatchResults((prev) => {
        const indicesToSkip = prev.filter((r) => !r.matchedEmployeeId).map((r) => r.rowIndex);
        setAutoSkippedRows(new Set(indicesToSkip));
        return prev.map((r) => (!r.matchedEmployeeId ? { ...r, matchedEmployeeId: "__skip__" } : r));
      });
    } else {
      setMatchResults((prev) => {
        const indices = new Set(autoSkippedRows);
        const updated = prev.map((r) => (indices.has(r.rowIndex) && r.matchedEmployeeId === "__skip__" ? { ...r, matchedEmployeeId: "" } : r));
        return updated;
      });
      setAutoSkippedRows(new Set());
    }
  };
  function datesOverlapOrAdjacent(aStart: string, aEnd: string | null, bStart: string, bEnd: string | null): boolean {
    const aS = new Date(aStart);
    const aE = aEnd ? new Date(aEnd) : new Date(aStart);
    const bS = new Date(bStart);
    const bE = bEnd ? new Date(bEnd) : new Date(bStart);
    // adjacent if aE + 1 day >= bS and bE + 1 day >= aS
    const add1 = (d: Date) => new Date(d.getTime() + 24 * 3600 * 1000);
    return add1(aE) >= bS && add1(bE) >= aS;
  }

  const onImport = async () => {
    if (!currentCompany?.id) {
      toast({ title: "Select a company first", variant: "destructive" });
      return;
    }
    if (!allMatched) {
      toast({ title: "Resolve unmatched employees before import", variant: "destructive" });
      return;
    }
    if (anyMismatches) {
      toast({ title: "Fix total days mismatches before import", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Group by employee
      const byEmp = new Map<string, ParsedRow[]>();
      matchResults.forEach((mr) => {
        if (!mr.matchedEmployeeId || mr.matchedEmployeeId === "__skip__") return; // skip ignored rows
        const empId = mr.matchedEmployeeId;
        if (!byEmp.has(empId)) byEmp.set(empId, []);
        byEmp.get(empId)!.push(mr.parsed);
      });

      for (const [employeeId, rows] of byEmp.entries()) {
        // 1) Coalesce new rows per employee
        const newIntervals = rows
          .filter((r) => r.startDate)
          .map((r) => ({
            start: r.startDate!,
            end: r.endDate ?? r.startDate!,
            total: r.totalDays,
            full: r.fullDays,
            half: r.halfDays + r.sspDays, // per user: SSP deducted from entitlement => count as half by default
            rawHalfOnly: r.halfDays,
            ssp: r.sspDays,
          }))
          .sort((a, b) => a.start.localeCompare(b.start));

        const coalesced: typeof newIntervals = [];
        for (const iv of newIntervals) {
          const last = coalesced[coalesced.length - 1];
          if (!last) coalesced.push({ ...iv });
          else if (datesOverlapOrAdjacent(last.start, last.end, iv.start, iv.end)) {
            last.start = last.start < iv.start ? last.start : iv.start;
            last.end = last.end > iv.end ? last.end : iv.end;
            last.total += iv.total;
            last.full += iv.full;
            last.half += iv.half;
            last.ssp += iv.ssp;
          } else coalesced.push({ ...iv });
        }

        // 2) Fetch existing records for employee
        const existing = await sicknessService.getSicknessRecords(employeeId);

        // 3) Merge with existing and apply changes
        for (const iv of coalesced) {
          const overlapping = existing.filter((er) => datesOverlapOrAdjacent(er.start_date, er.end_date ?? er.start_date, iv.start, iv.end));
          if (overlapping.length > 0) {
            const mergedStart = [iv.start, ...overlapping.map((o) => o.start_date)].sort()[0];
            const mergedEnd = [iv.end, ...overlapping.map((o) => o.end_date ?? o.start_date)].sort().slice(-1)[0];
            const existingTotal = overlapping.reduce((sum, r) => sum + Number(r.total_days || 0), 0);
            const mergedTotal = existingTotal + iv.total;

            // Delete overlapping existing records
            for (const r of overlapping) {
              await sicknessService.deleteSicknessRecord(r.id);
            }

            // Insert merged
            await sicknessService.recordSicknessAbsence({
              employee_id: employeeId,
              company_id: currentCompany.id,
              start_date: mergedStart,
              end_date: mergedEnd,
              total_days: mergedTotal,
              is_certified: false,
              certification_required_from_day: 8,
              reason: "Import merge",
              notes: `Imported and merged: full=${iv.full}, half/ssp=${iv.half}`,
              created_by: undefined,
            } as any);

            // Historical balance entry at end date
            await supabase.from("employee_sickness_historical_balances").insert({
              employee_id: employeeId,
              company_id: currentCompany.id,
              balance_date: mergedEnd,
              full_pay_days_used: iv.full,
              half_pay_days_used: iv.half,
              description: `Imported (merged)` ,
              notes: `Full=${iv.full}, Half=${iv.rawHalfOnly}, SSP=${iv.ssp}`,
            });
          } else {
            // No overlap: insert as-is
            const inserted = await sicknessService.recordSicknessAbsence({
              employee_id: employeeId,
              company_id: currentCompany.id,
              start_date: iv.start,
              end_date: iv.end,
              total_days: iv.total,
              is_certified: false,
              certification_required_from_day: 8,
              reason: "Import",
              notes: `Imported: full=${iv.full}, half/ssp=${iv.half}`,
              created_by: undefined,
            } as any);

            await supabase.from("employee_sickness_historical_balances").insert({
              employee_id: employeeId,
              company_id: currentCompany.id,
              balance_date: iv.end,
              full_pay_days_used: iv.full,
              half_pay_days_used: iv.half,
              description: `Imported` ,
              notes: `Full=${iv.full}, Half=${iv.rawHalfOnly}, SSP=${iv.ssp}`,
            });
          }
        }
      }

      toast({ title: "Import complete", description: `File ${fileName} processed successfully.` });
      setRawRows([]);
      setParsedRows([]);
      setMatchResults([]);
      setHeaders([]);
      setFileName("");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Import failed", description: err?.message ?? String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Sickness Import</h1>
        <p className="text-muted-foreground">Upload a CSV/XLSX file with DD/MM/YYYY dates. We'll fuzzy match employees and merge overlapping absences.</p>
        <link rel="canonical" href="/employees/sickness/import" />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1) Upload file</CardTitle>
          <CardDescription>Select a CSV or Excel file to begin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-md">
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={onFileChange} />
            {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
          </div>
        </CardContent>
      </Card>

      {rawRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2) Map columns</CardTitle>
            <CardDescription>Confirm detected columns. Adjust if needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { key: "payrollId", label: "Payroll ID" },
                { key: "lastName", label: "Surname" },
                { key: "firstName", label: "First name" },
                { key: "startDate", label: "Start date (DD/MM/YYYY)" },
                { key: "endDate", label: "End date (DD/MM/YYYY)" },
                { key: "totalDays", label: "Total days (optional)" },
              ] as const).map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Select
                    value={(mapping as any)[f.key] ?? undefined}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === "__none__" ? undefined : v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value="__none__">None</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Days + Type pairs (up to 3)</Label>
              {[0, 1, 2].map((i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Select
                    value={mapping.pairs[i]?.days ?? undefined}
                    onValueChange={(v) => setMapping((m) => {
                      const pairs = [...(m.pairs || [])];
                      pairs[i] = { ...(pairs[i] || {}), days: v === "__none__" ? undefined : v };
                      return { ...m, pairs };
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder={`Days column #${i + 1}`} /></SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value="__none__">None</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={mapping.pairs[i]?.type ?? undefined}
                    onValueChange={(v) => setMapping((m) => {
                      const pairs = [...(m.pairs || [])];
                      pairs[i] = { ...(pairs[i] || {}), type: v === "__none__" ? undefined : v };
                      return { ...m, pairs };
                    })}
                  >
                    <SelectTrigger><SelectValue placeholder={`Type column #${i + 1} (full/half/ssp)`} /></SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      <SelectItem value="__none__">None</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={parseRows}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {parsedRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3) Review matches</CardTitle>
            <CardDescription>Resolve any unmatched employees. Payroll ID → Surname → First name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="skip-all-unmatched"
                checked={skipAllUnmatched}
                onCheckedChange={handleToggleSkipAllUnmatched}
              />
              <label htmlFor="skip-all-unmatched" className="text-sm">
                {`Skip all unmatched employees${unmatchedCount > 0 ? ` (${unmatchedCount})` : ""}`}
              </label>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee from file</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days (F/H/SSP)</TableHead>
                  <TableHead>Matched employee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchResults.map((r) => (
                  <TableRow key={r.rowIndex} className={r.parsed.mismatchTotal ? "bg-destructive/10" : ""}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{r.parsed.nameGuess.last ?? ""}, {r.parsed.nameGuess.first ?? ""}</div>
                        <div className="text-muted-foreground">Payroll: {r.parsed.nameGuess.payroll ?? "-"}</div>
                        {r.parsed.mismatchTotal && (
                          <div className="text-destructive">Total mismatch: file {r.parsed.totalDays} vs sum {r.parsed.fullDays + r.parsed.halfDays + r.parsed.sspDays}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Start: {r.parsed.startDate ?? "-"}</div>
                        <div>End: {r.parsed.endDate ?? r.parsed.startDate ?? "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">F {r.parsed.fullDays} / H {r.parsed.halfDays} / SSP {r.parsed.sspDays}</div>
                    </TableCell>
                    <TableCell>
                      {r.matchedEmployeeId ? (
                        r.matchedEmployeeId === "__skip__" ? (
                          <div className="text-sm text-muted-foreground">
                            Skipped. This row will be ignored. {" "}
                            <Button type="button" variant="link" size="sm" onClick={() => updateCandidateSelection(r.rowIndex, "")}>Undo</Button>
                          </div>
                        ) : (
                          <div className="text-sm">
                            {(() => {
                              const emp = employees.find((e) => e.id === r.matchedEmployeeId);
                              return emp ? (
                                <div>
                                  <div>{emp.last_name}, {emp.first_name}</div>
                                  <div className="text-muted-foreground">Payroll: {emp.payroll_id ?? "-"}</div>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )
                      ) : (
                        <>
                          <Select onValueChange={(v) => updateCandidateSelection(r.rowIndex, v)}>
                            <SelectTrigger><SelectValue placeholder="Select match" /></SelectTrigger>
                            <SelectContent className="z-50 bg-background max-h-80 overflow-auto">
                              <SelectItem value="__skip__">Skip this employee</SelectItem>
                              {employees.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.last_name}, {e.first_name} ({e.payroll_id ?? "-"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="mt-1">
                            <Button type="button" variant="link" size="sm" onClick={() => handleToggleSkipAllUnmatched(true)}>
                              Skip all unmatched
                            </Button>
                          </div>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-3">
              <Button disabled={!allMatched || anyMismatches || submitting} onClick={onImport}>
                {submitting ? "Importing..." : "Import and merge"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
