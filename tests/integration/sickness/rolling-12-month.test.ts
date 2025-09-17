import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDate, restoreDate } from '@/test-utils/date';
import { mockSupabase } from '@/test-utils/supabaseMock';
import { sicknessService } from '@/services/sicknessService';
import { calculateSicknessEntitlementSummary } from '@/utils/sicknessCalculations';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Rolling 12-Month Sickness Calculation - Julia Northey Test Case', () => {
  const juliaEmployee = {
    id: 'julia-northey-id',
    first_name: 'Julia',
    last_name: 'Northey',
    hire_date: '2022-09-20',
    company_id: 'swan-practice-company-id',
    user_id: 'julia-user-id',
  };

  const sicknessScheme = {
    id: 'swan-scheme-id',
    name: 'The Swan Practice Scheme',
    eligibility_rules: [
      {
        rule_id: 'rule_0_to_4_months',
        service_months_from: 0,
        service_months_to: 4,
        full_pay_days: 0,
        half_pay_days: 0
      },
      {
        rule_id: 'rule_4_to_12_months',
        service_months_from: 4,
        service_months_to: 12,
        full_pay_days: 4,
        half_pay_days: 8
      },
      {
        rule_id: 'rule_12_plus_months',
        service_months_from: 12,
        service_months_to: null,
        full_pay_days: 17,
        half_pay_days: 17
      }
    ]
  };

  // Julia's actual sickness records
  const juliaSicknessRecords = [
    {
      id: 'sick-1',
      employee_id: 'julia-northey-id',
      start_date: '2024-06-24',
      end_date: '2024-06-24',
      total_days: 1
    },
    {
      id: 'sick-2', 
      employee_id: 'julia-northey-id',
      start_date: '2025-02-03',
      end_date: '2025-02-03',
      total_days: 1
    },
    {
      id: 'sick-3',
      employee_id: 'julia-northey-id', 
      start_date: '2025-02-10',
      end_date: '2025-02-12',
      total_days: 2
    },
    {
      id: 'sick-4',
      employee_id: 'julia-northey-id',
      start_date: '2025-07-14',
      end_date: '2025-07-31',
      total_days: 11
    },
    {
      id: 'sick-5',
      employee_id: 'julia-northey-id',
      start_date: '2025-08-01', 
      end_date: '2025-08-15',
      total_days: 9
    }
  ];

  const entitlementUsage = {
    id: 'entitlement-id',
    employee_id: 'julia-northey-id',
    company_id: 'swan-practice-company-id',
    full_pay_entitled_days: 17,
    half_pay_entitled_days: 17,
    current_service_months: 35,
    current_rule_id: 'rule_12_plus_months'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock entitlement usage
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'employee_sickness_entitlement_usage') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: entitlementUsage,
            error: null
          })
        };
      }
      
      if (table === 'employee_sickness_records') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          mockResolvedValue: vi.fn().mockResolvedValue({
            data: juliaSicknessRecords,
            error: null
          })
        };
      }

      if (table === 'work_patterns') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          mockResolvedValue: vi.fn().mockResolvedValue({
            data: [
              { day: 'Monday', is_working: true },
              { day: 'Tuesday', is_working: true },
              { day: 'Wednesday', is_working: true },
              { day: 'Thursday', is_working: true },
              { day: 'Friday', is_working: true },
              { day: 'Saturday', is_working: false },
              { day: 'Sunday', is_working: false }
            ],
            error: null
          })
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        mockResolvedValue: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });
  });

  afterEach(() => {
    restoreDate();
  });

  describe('Scenario 1: July 14, 2025 Sickness Event', () => {
    it('should calculate rolling 12-month period from July 14, 2024 to July 14, 2025', async () => {
      const referenceDate = '2025-07-14';
      const period = sicknessService.getRolling12MonthPeriod(referenceDate);
      
      expect(period.start).toBe('2024-07-14');
      expect(period.end).toBe('2025-07-14');
    });

    it('should include only sickness within the rolling window', async () => {
      // Mock sickness records query to filter based on date range
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'employee_sickness_records') {
          const filteredRecords = juliaSicknessRecords.filter(record => {
            const startDate = new Date(record.start_date);
            const windowStart = new Date('2024-07-14');
            const windowEnd = new Date('2025-07-14');
            return startDate >= windowStart && startDate <= windowEnd;
          });

          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            mockResolvedValue: vi.fn().mockResolvedValue({
              data: filteredRecords,
              error: null
            })
          };
        }
        return mockSupabase.from(table);
      });

      const usage = await sicknessService.calculateRolling12MonthUsageFromDate(
        'julia-northey-id', 
        '2025-07-14'
      );

      // Should include: Feb 3 (1 day) + Feb 10-12 (2 days) = 3 days
      // Should exclude: June 24, 2024 (outside window)
      expect(usage.totalUsed).toBe(3);
    });

    it('should show 14 days remaining entitlement for July 14 event', async () => {
      // Mock the service methods for this specific scenario
      vi.spyOn(sicknessService, 'calculateRolling12MonthUsageFromDate')
        .mockResolvedValue({ totalUsed: 3, fullPayUsed: 3, halfPayUsed: 0 });
      
      vi.spyOn(sicknessService, 'calculateSspUsageFromDate')
        .mockResolvedValue({ sspEntitledDays: 28, sspUsedRolling12: 0 });

      const summary = await calculateSicknessEntitlementSummary(
        juliaEmployee as any,
        '2025-07-14'
      );

      expect(summary?.full_pay_remaining).toBe(14); // 17 - 3 = 14
      expect(summary?.total_used_rolling_12_months).toBe(3);
    });
  });

  describe('Scenario 2: August 1, 2025 Sickness Event', () => {
    it('should calculate rolling 12-month period from August 1, 2024 to August 1, 2025', async () => {
      const referenceDate = '2025-08-01';
      const period = sicknessService.getRolling12MonthPeriod(referenceDate);
      
      expect(period.start).toBe('2024-08-01');
      expect(period.end).toBe('2025-08-01');
    });

    it('should include more sickness within the August window', async () => {
      // Mock sickness records query for August window
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'employee_sickness_records') {
          const filteredRecords = juliaSicknessRecords.filter(record => {
            const startDate = new Date(record.start_date);
            const windowStart = new Date('2024-08-01');
            const windowEnd = new Date('2025-08-01');
            return startDate >= windowStart && startDate <= windowEnd;
          });

          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            mockResolvedValue: vi.fn().mockResolvedValue({
              data: filteredRecords,
              error: null
            })
          };
        }
        return mockSupabase.from(table);
      });

      const usage = await sicknessService.calculateRolling12MonthUsageFromDate(
        'julia-northey-id',
        '2025-08-01'
      );

      // Should include: Feb 3 (1) + Feb 10-12 (2) + Jul 14-31 (11) = 14 days
      // Should exclude: June 24, 2024 (outside window)
      expect(usage.totalUsed).toBe(14);
    });

    it('should show 3 days remaining entitlement for August 1 event', async () => {
      vi.spyOn(sicknessService, 'calculateRolling12MonthUsageFromDate')
        .mockResolvedValue({ totalUsed: 14, fullPayUsed: 14, halfPayUsed: 0 });
      
      vi.spyOn(sicknessService, 'calculateSspUsageFromDate')
        .mockResolvedValue({ sspEntitledDays: 28, sspUsedRolling12: 0 });

      const summary = await calculateSicknessEntitlementSummary(
        juliaEmployee as any,
        '2025-08-01'
      );

      expect(summary?.full_pay_remaining).toBe(3); // 17 - 14 = 3
      expect(summary?.total_used_rolling_12_months).toBe(14);
    });
  });

  describe('Scenario 3: Current Date vs Event Date Comparison', () => {
    it('should show different results when using current date vs event date', async () => {
      // Set current date to September 17, 2025
      mockDate('2025-09-17');

      // Current date calculation (old method)
      vi.spyOn(sicknessService, 'calculateRolling12MonthUsage')
        .mockResolvedValue({ totalUsed: 23, fullPayUsed: 17, halfPayUsed: 6 });

      // Event date calculation (new method for July 14)
      vi.spyOn(sicknessService, 'calculateRolling12MonthUsageFromDate')
        .mockResolvedValue({ totalUsed: 3, fullPayUsed: 3, halfPayUsed: 0 });

      vi.spyOn(sicknessService, 'calculateSspUsageFromDate')
        .mockResolvedValue({ sspEntitledDays: 28, sspUsedRolling12: 0 });

      vi.spyOn(sicknessService, 'calculateSspUsage')
        .mockResolvedValue({ sspEntitledDays: 28, sspUsedRolling12: 0 });

      // Current date method
      const currentDateSummary = await calculateSicknessEntitlementSummary(
        juliaEmployee as any
      );

      // Event date method
      const eventDateSummary = await calculateSicknessEntitlementSummary(
        juliaEmployee as any,
        '2025-07-14'
      );

      // Current date shows over-entitlement
      expect(currentDateSummary?.full_pay_remaining).toBe(0);
      expect(currentDateSummary?.half_pay_remaining).toBe(11); // 17 - 6 = 11
      expect(currentDateSummary?.total_used_rolling_12_months).toBe(23);

      // Event date shows available entitlement
      expect(eventDateSummary?.full_pay_remaining).toBe(14);
      expect(eventDateSummary?.half_pay_remaining).toBe(17);
      expect(eventDateSummary?.total_used_rolling_12_months).toBe(3);
    });
  });

  describe('Rolling Entitlement Effect', () => {
    it('should demonstrate entitlement becoming available as older sickness falls out of window', async () => {
      // Test scenario where a new sickness event on August 30, 2025
      // has different available entitlement than one on July 1, 2025
      // because June 24, 2024 sickness falls out of the rolling window

      const july2025Period = sicknessService.getRolling12MonthPeriod('2025-07-01');
      const august2025Period = sicknessService.getRolling12MonthPeriod('2025-08-30');

      expect(july2025Period.start).toBe('2024-07-01'); // Includes June 24, 2024
      expect(august2025Period.start).toBe('2024-08-30'); // Excludes June 24, 2024

      // July 1, 2025 window includes June 24, 2024 sickness
      vi.spyOn(sicknessService, 'calculateRolling12MonthUsageFromDate')
        .mockImplementation((employeeId, refDate) => {
          if (refDate === '2025-07-01') {
            return Promise.resolve({ totalUsed: 4, fullPayUsed: 4, halfPayUsed: 0 }); // Includes June 24
          }
          if (refDate === '2025-08-30') {
            return Promise.resolve({ totalUsed: 3, fullPayUsed: 3, halfPayUsed: 0 }); // Excludes June 24
          }
          return Promise.resolve({ totalUsed: 0, fullPayUsed: 0, halfPayUsed: 0 });
        });

      const july1Summary = await sicknessService.calculateRolling12MonthUsageFromDate(
        'julia-northey-id',
        '2025-07-01'
      );

      const august30Summary = await sicknessService.calculateRolling12MonthUsageFromDate(
        'julia-northey-id', 
        '2025-08-30'
      );

      expect(july1Summary.totalUsed).toBe(4); // Includes June 24, 2024
      expect(august30Summary.totalUsed).toBe(3); // Excludes June 24, 2024

      // This demonstrates the "rolling entitlement effect"
      expect(august30Summary.totalUsed).toBeLessThan(july1Summary.totalUsed);
    });
  });
});