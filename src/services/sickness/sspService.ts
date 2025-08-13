import { supabase } from "@/integrations/supabase/client";
import { fetchWorkPatterns } from "@/components/employees/details/work-pattern/services/fetchPatterns";
import { calculateWorkingDaysPerWeek } from "@/components/employees/details/sickness/utils/workPatternCalculations";

// Helper: map weekday name to JS getDay index
const weekdayToIndex: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function buildQualifyingSet(workPattern: any[]): Set<number> {
  const set = new Set<number>();
  for (const day of workPattern) {
    // day.day expected like 'Monday', 'Tuesday', etc
    if (day.isWorking && weekdayToIndex[day.day] !== undefined) {
      set.add(weekdayToIndex[day.day]);
    }
  }
  return set;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function normalizeDate(d: Date | string): Date {
  const date = new Date(d);
  // normalize to midnight to avoid DST issues
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function countQualifyingDaysBetween(start: Date, end: Date, qualifyingSet: Set<number>): number {
  let count = 0;
  let current = normalizeDate(start);
  const endN = normalizeDate(end);
  while (current <= endN) {
    if (qualifyingSet.has(current.getDay())) count++;
    current = addDays(current, 1);
  }
  return count;
}

interface SicknessSpan {
  start: Date;
  end: Date;
  qualifyingDays: number; // qualifying days within [start, end]
}

interface Chain {
  spans: SicknessSpan[];
}

function buildPiws(records: { start_date: string; end_date: string | null; total_days: number }[], qualifyingSet: Set<number>): SicknessSpan[] {
  const spans: SicknessSpan[] = records.map(r => {
    const start = normalizeDate(r.start_date);
    const end = normalizeDate(r.end_date || r.start_date);
    return {
      start,
      end,
      qualifyingDays: countQualifyingDaysBetween(start, end, qualifyingSet),
    };
  });
  // Keep only PIWs (>= 4 qualifying days)
  return spans.filter(s => s.qualifyingDays >= 4).sort((a, b) => a.start.getTime() - b.start.getTime());
}

function buildLinkedChains(piws: SicknessSpan[]): Chain[] {
  const chains: Chain[] = [];
  let current: Chain | null = null;
  for (const span of piws) {
    if (!current) {
      current = { spans: [span] };
      continue;
    }
    const prev = current.spans[current.spans.length - 1];
    const gap = diffDays(prev.end, span.start); // days between prev end and current start
    if (gap <= 56) {
      current.spans.push(span);
    } else {
      chains.push(current);
      current = { spans: [span] };
    }
  }
  if (current) chains.push(current);
  return chains;
}

function countSspDaysInRangeForChain(chain: Chain, qualifyingSet: Set<number>, qDaysPerWeek: number, rangeStart: Date, rangeEnd: Date): number {
  const cap = 28 * qDaysPerWeek; // per linked PIW chain
  let capUsed = 0;
  let qualifyingSeen = 0; // across chain
  let usedInRange = 0;

  for (const span of chain.spans) {
    let current = normalizeDate(span.start);
    const end = normalizeDate(span.end);
    while (current <= end) {
      const isQualifying = qualifyingSet.has(current.getDay());
      if (isQualifying) {
        qualifyingSeen += 1;
        if (qualifyingSeen > 3 && capUsed < cap) {
          // this day is SSP-covered regardless of range; increment capUsed
          capUsed += 1;
          if (current >= rangeStart && current <= rangeEnd) {
            usedInRange += 1;
          }
        }
      }
      current = addDays(current, 1);
    }
  }

  return usedInRange;
}

export const sspService = {
  // Calculate SSP usage using PIW and linking rules
  async calculateSspUsage(employeeId: string): Promise<{
    qualifyingDaysPerWeek: number;
    sspEntitledDays: number;
    sspUsedCurrentYear: number;
    sspUsedRolling12: number;
  }> {
    const workPattern = await fetchWorkPatterns(employeeId);
    const qualifyingDaysPerWeek = calculateWorkingDaysPerWeek(workPattern);
    const qualifyingSet = buildQualifyingSet(workPattern);

    // Fetch all sickness records sorted by start_date asc
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .select('start_date, end_date, total_days')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    const piws = buildPiws(data || [], qualifyingSet);
    const chains = buildLinkedChains(piws);

    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    // Rolling 12-month period from calculation utils replicated here to avoid circular dep
    const rollingEnd = normalizeDate(now);
    const rollingStart = addDays(new Date(rollingEnd.getFullYear() - 1, rollingEnd.getMonth(), rollingEnd.getDate()), 1);

    let usedCurrentYear = 0;
    let usedRolling = 0;

    for (const chain of chains) {
      usedCurrentYear += countSspDaysInRangeForChain(chain, qualifyingSet, qualifyingDaysPerWeek, yearStart, yearEnd);
      usedRolling += countSspDaysInRangeForChain(chain, qualifyingSet, qualifyingDaysPerWeek, rollingStart, rollingEnd);
    }

    return {
      qualifyingDaysPerWeek,
      sspEntitledDays: 28 * qualifyingDaysPerWeek,
      sspUsedCurrentYear: usedCurrentYear,
      sspUsedRolling12: usedRolling,
    };
  }
};
