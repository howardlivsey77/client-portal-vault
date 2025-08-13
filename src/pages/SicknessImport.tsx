import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

// Types for sickness scheme allocation import
interface SchemeMapping {
  firstName?: string;
  lastName?: string;
  sicknessScheme?: string;
}

interface SchemeParseResult {
  raw: RawRow;
  nameGuess: { first?: string; last?: string };
  schemeGuess: string;
}

interface SchemeMatchResult {
  rowIndex: number;
  parsed: SchemeParseResult;
  matchedEmployeeId?: string;
  matchedSchemeId?: string;
  candidates: { id: string; payroll_id?: string | null; first_name: string; last_name: string; score: number }[];
}

interface SicknessScheme {
  id: string;
  name: string;
  company_id: string;
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

function suggestSchemeMapping(headers: string[]): SchemeMapping {
  const lower = headers.map((h) => h.toLowerCase());
  const findHeader = (candidates: string[]) => {
    const idx = lower.findIndex((h) => candidates.some((c) => h.includes(c)));
    return idx >= 0 ? headers[idx] : undefined;
  };

  return {
    firstName: findHeader(["first", "forename", "given name"]),
    lastName: findHeader(["surname", "last", "family name"]),
    sicknessScheme: findHeader(["sickness scheme", "scheme", "sick pay", "entitlement"]),
  };
}

export default function SicknessImport() {
  const { toast } = useToast();
  const { employees } = useEmployees();
  const { currentCompany } = useCompany();

  // Import type selection
  const [importType, setImportType] = useState<"records" | "schemes">("records");

  // Clear state when switching import types
  useEffect(() => {
    setRawRows([]);
    setHeaders([]);
    setFileName("");
    setParsedRows([]);
    setMatchResults([]);
    setSchemeParsedRows([]);
    setSchemeMatchResults([]);
    setMapping({ pairs: [] });
    setSchemeMapping({});
  }, [importType]);

  // Common state
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Sickness records import state
  const [mapping, setMapping] = useState<Mapping>({ pairs: [] });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [skipAllUnmatched, setSkipAllUnmatched] = useState(false);
  const [autoSkippedRows, setAutoSkippedRows] = useState<Set<number>>(new Set());
  const [ignoreMismatches, setIgnoreMismatches] = useState(false);

  // Sickness scheme allocation state
  const [schemeMapping, setSchemeMapping] = useState<SchemeMapping>({});
  const [schemeParsedRows, setSchemeParsedRows] = useState<SchemeParseResult[]>([]);
  const [schemeMatchResults, setSchemeMatchResults] = useState<SchemeMatchResult[]>([]);
  const [availableSchemes, setAvailableSchemes] = useState<SicknessScheme[]>([]);
  const [schemeSkipAllUnmatched, setSchemeSkipAllUnmatched] = useState(false);

  // Build fuse over employees for fuzzy surname/firstname - enhanced for scheme allocations
  const fuse = useMemo(() => {
    return new Fuse(
      employees.map((e) => ({ ...e })),
      {
        includeScore: true,
        threshold: 0.4, // More lenient for scheme allocations
        keys: [
          { name: "last_name", weight: 0.8 }, // Higher weight for surname
          { name: "first_name", weight: 0.2 },
          { name: "payroll_id", weight: 0.1 }, // Include payroll for additional matching
        ],
      }
    );
  }, [employees]);

  // Enhanced employee matching with better name normalization
  const findEmployeeMatches = (firstName: string = "", lastName: string = "", payrollId?: string) => {
    const candidates: { id: string; payroll_id?: string | null; first_name: string; last_name: string; score: number }[] = [];
    
    // Normalize names
    const normalizeText = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const normFirst = normalizeText(firstName);
    const normLast = normalizeText(lastName);
    
    // 1) Exact payroll ID match first
    if (payrollId) {
      const normPayroll = normalizeText(payrollId);
      const exactPayrollMatch = employees.find(e => 
        normalizeText(e.payroll_id || '') === normPayroll
      );
      if (exactPayrollMatch) {
        return {
          bestMatch: exactPayrollMatch.id,
          candidates: [{
            id: exactPayrollMatch.id,
            payroll_id: exactPayrollMatch.payroll_id,
            first_name: exactPayrollMatch.first_name,
            last_name: exactPayrollMatch.last_name,
            score: 0 // Perfect match
          }]
        };
      }
    }

    // 2) Surname-first fuzzy matching with multiple search strategies
    const searchQueries = [
      `${normLast} ${normFirst}`, // Primary: surname first
      `${normFirst} ${normLast}`, // Fallback: first name first
      normLast, // Surname only if available
    ].filter(q => q.trim());

    let bestScore = 1;
    let bestMatchId: string | undefined;

    searchQueries.forEach(query => {
      if (query.trim()) {
        const results = fuse.search(query).slice(0, 10);
        results.forEach(result => {
          const item = result.item as any;
          const score = result.score ?? 1;
          
          // Boost score for exact surname matches
          const isExactSurnameMatch = normalizeText(item.last_name) === normLast;
          const adjustedScore = isExactSurnameMatch ? score * 0.5 : score;
          
          if (adjustedScore < bestScore) {
            bestScore = adjustedScore;
            bestMatchId = item.id;
          }
          
          // Add unique candidates
          if (!candidates.find(c => c.id === item.id)) {
            candidates.push({
              id: item.id,
              payroll_id: item.payroll_id,
              first_name: item.first_name,
              last_name: item.last_name,
              score: adjustedScore,
            });
          }
        });
      }
    });

    // Sort candidates by score and limit to top 5
    candidates.sort((a, b) => a.score - b.score);
    const topCandidates = candidates.slice(0, 5);

    // Auto-match if confidence is high enough
    const autoMatchThreshold = 0.15;
    const autoMatch = bestScore <= autoMatchThreshold ? bestMatchId : undefined;

    return {
      bestMatch: autoMatch,
      candidates: topCandidates
    };
  };

  useEffect(() => {
    document.title = "Sickness Import | Employees";
  }, []);

  // Fetch available sickness schemes for current company
  useEffect(() => {
    const fetchSchemes = async () => {
      if (!currentCompany?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('sickness_schemes')
          .select('id, name, company_id')
          .eq('company_id', currentCompany.id);
        
        if (error) throw error;
        setAvailableSchemes(data || []);
      } catch (error) {
        console.error('Error fetching sickness schemes:', error);
        toast({
          title: "Error loading sickness schemes",
          description: "Could not load available sickness schemes",
          variant: "destructive"
        });
      }
    };

    fetchSchemes();
  }, [currentCompany?.id, toast]);

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
      
      if (importType === "records") {
        const guess = suggestMapping(headers, data[0] as RawRow);
        setMapping(guess);
      } else {
        const schemeGuess = suggestSchemeMapping(headers);
        setSchemeMapping(schemeGuess);
      }
      
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

      // 2) Enhanced fuzzy matching if not matched
      if (!matchedEmployeeId) {
        const last = (parsed.nameGuess.last ?? "").toString();
        const first = (parsed.nameGuess.first ?? "").toString();
        const payroll = parsed.nameGuess.payroll;
        
        const matchResult = findEmployeeMatches(first, last, payroll);
        matchedEmployeeId = matchResult.bestMatch;
        candidates = matchResult.candidates;
      }

      return { rowIndex: idx, parsed, matchedEmployeeId, candidates };
    });

    setMatchResults(results);
  };

  // Parse scheme allocation rows
  const parseSchemesRows = () => {
    if (!rawRows.length) return;

    const rows: SchemeParseResult[] = rawRows.map((row) => ({
      raw: row,
      nameGuess: {
        first: schemeMapping.firstName ? String(row[schemeMapping.firstName] ?? "").trim() : undefined,
        last: schemeMapping.lastName ? String(row[schemeMapping.lastName] ?? "").trim() : undefined,
      },
      schemeGuess: schemeMapping.sicknessScheme ? String(row[schemeMapping.sicknessScheme] ?? "").trim() : "",
    }));

    setSchemeParsedRows(rows);

    // Attempt matching employees and schemes
    const results: SchemeMatchResult[] = rows.map((parsed, idx) => {
      let matchedEmployeeId: string | undefined;
      let matchedSchemeId: string | undefined;
      let candidates: SchemeMatchResult["candidates"] = [];

      // Enhanced employee matching for scheme allocation
      const last = (parsed.nameGuess.last ?? "").toString();
      const first = (parsed.nameGuess.first ?? "").toString();
      
      const matchResult = findEmployeeMatches(first, last);
      matchedEmployeeId = matchResult.bestMatch;
      candidates = matchResult.candidates;

      // Enhanced scheme matching with fuzzy logic
      const schemeName = parsed.schemeGuess.toLowerCase().trim();
      if (schemeName) {
        // Try exact match first
        let matchedScheme = availableSchemes.find(scheme => 
          scheme.name.toLowerCase() === schemeName
        );
        
        // Try partial match
        if (!matchedScheme) {
          matchedScheme = availableSchemes.find(scheme => 
            scheme.name.toLowerCase().includes(schemeName) || 
            schemeName.includes(scheme.name.toLowerCase())
          );
        }
        
        // Try fuzzy matching for common abbreviations
        if (!matchedScheme) {
          const normalizeScheme = (name: string) => name.toLowerCase()
            .replace(/\b(sick|pay|scheme|entitlement|practice)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          const normalizedInput = normalizeScheme(schemeName);
          matchedScheme = availableSchemes.find(scheme => {
            const normalizedScheme = normalizeScheme(scheme.name);
            return normalizedScheme.includes(normalizedInput) || 
                   normalizedInput.includes(normalizedScheme);
          });
        }
        
        if (matchedScheme) {
          matchedSchemeId = matchedScheme.id;
        }
      }

      return { rowIndex: idx, parsed, matchedEmployeeId, matchedSchemeId, candidates };
    });

    setSchemeMatchResults(results);
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

  const updateSchemeSelection = (rowIndex: number, employeeId: string, schemeId?: string) => {
    setSchemeMatchResults((prev) => prev.map((r) => 
      r.rowIndex === rowIndex 
        ? { ...r, matchedEmployeeId: employeeId, matchedSchemeId: schemeId }
        : r
    ));
  };

  // Bulk skip functionality for scheme allocations
  const handleSchemeToggleSkipAllUnmatched = (checked: boolean) => {
    const isChecked = !!checked;
    setSchemeSkipAllUnmatched(isChecked);
    if (isChecked) {
      setSchemeMatchResults((prev) => 
        prev.map((r) => (!r.matchedEmployeeId || !r.matchedSchemeId) 
          ? { ...r, matchedEmployeeId: "__skip__", matchedSchemeId: "__skip__" } 
          : r
        )
      );
    } else {
      setSchemeMatchResults((prev) => 
        prev.map((r) => (r.matchedEmployeeId === "__skip__") 
          ? { ...r, matchedEmployeeId: "", matchedSchemeId: "" } 
          : r
        )
      );
    }
  };

  const allMatched = useMemo(() => matchResults.length > 0 && matchResults.every((r) => !!r.matchedEmployeeId), [matchResults]);
  const anyMismatches = useMemo(() => parsedRows.some((r) => r.mismatchTotal), [parsedRows]);
  const unmatchedCount = useMemo(() => matchResults.filter((r) => !r.matchedEmployeeId).length, [matchResults]);
  const mismatchCount = useMemo(() => parsedRows.filter((r) => r.mismatchTotal).length, [parsedRows]);

  // Scheme-specific computed values
  const allSchemesMatched = useMemo(() => 
    schemeMatchResults.length > 0 && 
    schemeMatchResults.every((r) => !!r.matchedEmployeeId && !!r.matchedSchemeId)
  , [schemeMatchResults]);
  const schemeUnmatchedCount = useMemo(() => 
    schemeMatchResults.filter((r) => !r.matchedEmployeeId || !r.matchedSchemeId).length
  , [schemeMatchResults]);

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
    if (anyMismatches && !ignoreMismatches) {
      toast({ title: "Total days mismatches detected", description: "Tick 'Ignore mismatches' to proceed or fix the mappings.", variant: "destructive" });
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

  const onSchemeImport = async () => {
    if (!currentCompany?.id) {
      toast({ title: "Select a company first", variant: "destructive" });
      return;
    }
    if (!allSchemesMatched) {
      toast({ title: "Resolve unmatched employees and schemes before import", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const updates = schemeMatchResults
        .filter((r) => r.matchedEmployeeId && r.matchedSchemeId && r.matchedEmployeeId !== "__skip__")
        .map((r) => ({
          employee_id: r.matchedEmployeeId!,
          sickness_scheme_id: r.matchedSchemeId!,
        }));

      // Batch update employees with their new sickness schemes
      for (const update of updates) {
        const { error } = await supabase
          .from('employees')
          .update({ sickness_scheme_id: update.sickness_scheme_id })
          .eq('id', update.employee_id);

        if (error) throw error;
      }

      toast({ 
        title: "Scheme allocation complete", 
        description: `Successfully allocated sickness schemes to ${updates.length} employees.` 
      });
      
      // Reset state
      setRawRows([]);
      setSchemeParsedRows([]);
      setSchemeMatchResults([]);
      setHeaders([]);
      setFileName("");
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Scheme allocation failed", 
        description: err?.message ?? String(err), 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Sickness Import</h1>
        <p className="text-muted-foreground">
          Upload a CSV/XLSX file to import sickness records or allocate sickness schemes to employees.
        </p>
        <link rel="canonical" href="/employees/sickness/import" />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Import Type</CardTitle>
          <CardDescription>Choose what type of data you want to import</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={importType} onValueChange={(value: "records" | "schemes") => setImportType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="records" id="records" />
              <Label htmlFor="records">Sickness Records</Label>
              <span className="text-sm text-muted-foreground">- Import absence records with dates and days</span>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="schemes" id="schemes" />
              <Label htmlFor="schemes">Sickness Scheme Allocations</Label>
              <span className="text-sm text-muted-foreground">- Assign sickness schemes to employees</span>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            {importType === "records" 
              ? "Upload a CSV/XLSX file with DD/MM/YYYY dates. We'll fuzzy match employees and merge overlapping absences."
              : "Upload a CSV/XLSX file with employee names and sickness scheme names to allocate schemes in bulk."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-md">
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={onFileChange} />
            {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
          </div>
        </CardContent>
      </Card>

      {rawRows.length > 0 && importType === "records" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>Confirm detected columns for sickness records. Adjust if needed.</CardDescription>
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

      {rawRows.length > 0 && importType === "schemes" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>Map columns for sickness scheme allocation. All fields are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { key: "firstName", label: "First Name" },
                { key: "lastName", label: "Surname" },
                { key: "sicknessScheme", label: "Sickness Scheme" },
              ] as const).map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Select
                    value={(schemeMapping as any)[f.key] ?? undefined}
                    onValueChange={(v) => setSchemeMapping((m) => ({ ...m, [f.key]: v === "__none__" ? undefined : v }))}
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

            <div className="flex gap-3">
              <Button onClick={parseSchemesRows}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {parsedRows.length > 0 && importType === "records" && (
        <Card>
          <CardHeader>
            <CardTitle>Review Sickness Record Matches</CardTitle>
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
            {anyMismatches && (
              <div className="flex flex-wrap items-center gap-3 text-destructive">
                <span>{mismatchCount} row(s) have total days mismatches.</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ignore-mismatches"
                    checked={ignoreMismatches}
                    onCheckedChange={(c) => setIgnoreMismatches(!!c)}
                  />
                  <label htmlFor="ignore-mismatches" className="text-sm">
                    Ignore mismatches and proceed
                  </label>
                </div>
              </div>
            )}
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
                         <div className="space-y-2">
                           <Select onValueChange={(v) => updateCandidateSelection(r.rowIndex, v)}>
                             <SelectTrigger><SelectValue placeholder="Select match" /></SelectTrigger>
                             <SelectContent className="z-50 bg-background max-h-80 overflow-auto">
                               <SelectItem value="__skip__">Skip this employee</SelectItem>
                               {r.candidates.length > 0 && (
                                 <>
                                   <SelectItem value="" disabled className="text-xs font-medium text-muted-foreground">
                                     — Suggested matches —
                                   </SelectItem>
                                   {r.candidates.slice(0, 3).map((candidate) => (
                                     <SelectItem key={candidate.id} value={candidate.id}>
                                       {candidate.last_name}, {candidate.first_name} ({candidate.payroll_id ?? "-"})
                                       <span className="ml-2 text-xs text-muted-foreground">
                                         {Math.round((1 - candidate.score) * 100)}% match
                                       </span>
                                     </SelectItem>
                                   ))}
                                   <SelectItem value="" disabled className="text-xs font-medium text-muted-foreground">
                                     — All employees —
                                   </SelectItem>
                                 </>
                               )}
                               {employees.map((e) => (
                                 <SelectItem key={e.id} value={e.id}>
                                   {e.last_name}, {e.first_name} ({e.payroll_id ?? "-"})
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           {r.candidates.length === 0 && (
                             <div className="text-xs text-orange-600">
                               No close matches found. Please select manually.
                             </div>
                           )}
                         </div>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-3">
              <Button disabled={!allMatched || (anyMismatches && !ignoreMismatches) || submitting} onClick={onImport}>
                {submitting ? "Importing..." : "Import and merge"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {schemeParsedRows.length > 0 && importType === "schemes" && (
        <Card>
          <CardHeader>
            <CardTitle>Review Scheme Allocations</CardTitle>
            <CardDescription>Verify employee matches and sickness scheme assignments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="scheme-skip-all-unmatched"
                  checked={schemeSkipAllUnmatched}
                  onCheckedChange={handleSchemeToggleSkipAllUnmatched}
                />
                <label htmlFor="scheme-skip-all-unmatched" className="text-sm">
                  {`Skip all unmatched items${schemeUnmatchedCount > 0 ? ` (${schemeUnmatchedCount})` : ""}`}
                </label>
              </div>
              <span className="text-sm text-muted-foreground">
                {`${schemeUnmatchedCount > 0 ? `${schemeUnmatchedCount} need attention` : "All items ready"}`}
              </span>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee from file</TableHead>
                  <TableHead>Matched employee</TableHead>
                  <TableHead>Sickness scheme</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemeMatchResults.map((r) => (
                  <TableRow key={r.rowIndex}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{r.parsed.nameGuess.last ?? ""}, {r.parsed.nameGuess.first ?? ""}</div>
                        <div className="text-muted-foreground">Scheme: {r.parsed.schemeGuess}</div>
                      </div>
                    </TableCell>
                     <TableCell>
                       {r.matchedEmployeeId ? (
                         r.matchedEmployeeId === "__skip__" ? (
                           <div className="text-sm text-muted-foreground">
                             Skipped {" "}
                             <Button type="button" variant="link" size="sm" onClick={() => updateSchemeSelection(r.rowIndex, "", "")}>
                               Undo
                             </Button>
                           </div>
                         ) : (
                           <div className="text-sm">
                             {(() => {
                               const emp = employees.find((e) => e.id === r.matchedEmployeeId);
                               const candidate = r.candidates.find((c) => c.id === r.matchedEmployeeId);
                               return emp ? (
                                 <div>
                                   <div>{emp.last_name}, {emp.first_name}</div>
                                   <div className="text-muted-foreground">
                                     Payroll: {emp.payroll_id ?? "-"}
                                     {candidate && candidate.score > 0 && (
                                       <span className="ml-2 text-xs">
                                         (Match: {Math.round((1 - candidate.score) * 100)}%)
                                       </span>
                                     )}
                                   </div>
                                 </div>
                               ) : null;
                             })()}
                           </div>
                         )
                       ) : (
                         <div className="space-y-2">
                           <Select onValueChange={(v) => updateSchemeSelection(r.rowIndex, v, r.matchedSchemeId)}>
                             <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                             <SelectContent className="z-50 bg-background max-h-80 overflow-auto">
                               <SelectItem value="__skip__">Skip this row</SelectItem>
                               {r.candidates.length > 0 && (
                                 <>
                                   <SelectItem value="" disabled className="text-xs font-medium text-muted-foreground">
                                     — Suggested matches —
                                   </SelectItem>
                                   {r.candidates.slice(0, 3).map((candidate) => (
                                     <SelectItem key={candidate.id} value={candidate.id}>
                                       {candidate.last_name}, {candidate.first_name} ({candidate.payroll_id ?? "-"})
                                       <span className="ml-2 text-xs text-muted-foreground">
                                         {Math.round((1 - candidate.score) * 100)}% match
                                       </span>
                                     </SelectItem>
                                   ))}
                                   <SelectItem value="" disabled className="text-xs font-medium text-muted-foreground">
                                     — All employees —
                                   </SelectItem>
                                 </>
                               )}
                               {employees.map((e) => (
                                 <SelectItem key={e.id} value={e.id}>
                                   {e.last_name}, {e.first_name} ({e.payroll_id ?? "-"})
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           {r.candidates.length === 0 && (
                             <div className="text-xs text-orange-600">
                               No close matches found. Please select manually.
                             </div>
                           )}
                         </div>
                       )}
                    </TableCell>
                    <TableCell>
                      {r.matchedSchemeId ? (
                        <div className="text-sm">
                          {availableSchemes.find(s => s.id === r.matchedSchemeId)?.name}
                        </div>
                      ) : (
                        <Select 
                          onValueChange={(v) => updateSchemeSelection(r.rowIndex, r.matchedEmployeeId || "", v)}
                          value={r.matchedSchemeId}
                        >
                          <SelectTrigger><SelectValue placeholder="Select scheme" /></SelectTrigger>
                          <SelectContent className="z-50 bg-background max-h-80 overflow-auto">
                            {availableSchemes.map((scheme) => (
                              <SelectItem key={scheme.id} value={scheme.id}>
                                {scheme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {r.matchedEmployeeId && r.matchedSchemeId && r.matchedEmployeeId !== "__skip__" ? (
                          <span className="text-green-600">✓ Ready</span>
                        ) : r.matchedEmployeeId === "__skip__" ? (
                          <span className="text-muted-foreground">Skipped</span>
                        ) : (
                          <span className="text-orange-600">Needs attention</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-3">
              <Button 
                disabled={!allSchemesMatched || submitting} 
                onClick={onSchemeImport}
              >
                {submitting ? "Allocating..." : "Allocate Schemes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
