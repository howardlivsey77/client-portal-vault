import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculationUtils } from '@/services/sickness/calculationUtils'
import { mockDate, restoreDate, testDates } from '@/test-utils/date'
import { mockSupabase, mockSupabaseFrom } from '@/test-utils/supabaseMock'

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

describe('calculationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    restoreDate()
  })

  describe('getRolling12MonthPeriod', () => {
    it('should return correct 12-month period from current date', () => {
      mockDate('2024-06-15')
      
      const result = calculationUtils.getRolling12MonthPeriod()
      
      expect(result.start).toBe('2023-06-16')
      expect(result.end).toBe('2024-06-15')
    })

    it('should handle year boundary correctly', () => {
      mockDate('2024-01-15')
      
      const result = calculationUtils.getRolling12MonthPeriod()
      
      expect(result.start).toBe('2023-01-16')
      expect(result.end).toBe('2024-01-15')
    })
  })

  describe('calculateServiceMonths', () => {
    it('should calculate service months correctly for same year', () => {
      mockDate('2024-06-15')
      
      const result = calculationUtils.calculateServiceMonths('2024-01-15')
      
      expect(result).toBe(5) // 5 months difference
    })

    it('should calculate service months correctly across years', () => {
      mockDate('2024-06-15')
      
      const result = calculationUtils.calculateServiceMonths('2023-06-15')
      
      expect(result).toBe(12) // Exactly 12 months
    })

    it('should handle partial months correctly', () => {
      mockDate('2024-06-30')
      
      const result = calculationUtils.calculateServiceMonths('2024-01-01')
      
      expect(result).toBe(5) // Should round down partial months
    })

    it('should return 0 for future hire dates', () => {
      mockDate('2024-06-15')
      
      const result = calculationUtils.calculateServiceMonths('2024-12-15')
      
      expect(result).toBe(0)
    })
  })

  describe('findApplicableRule', () => {
    const mockRules = [
      { id: '1', min_service_months: 0, max_service_months: 5, full_pay_amount: 1, full_pay_unit: 'weeks' as const, half_pay_amount: 1, half_pay_unit: 'weeks' as const },
      { id: '2', min_service_months: 6, max_service_months: 23, full_pay_amount: 1, full_pay_unit: 'months' as const, half_pay_amount: 2, half_pay_unit: 'months' as const },
      { id: '3', min_service_months: 24, max_service_months: 59, full_pay_amount: 2, full_pay_unit: 'months' as const, half_pay_amount: 3, half_pay_unit: 'months' as const },
      { id: '4', min_service_months: 60, max_service_months: null, full_pay_amount: 6, full_pay_unit: 'months' as const, half_pay_amount: 6, half_pay_unit: 'months' as const },
    ]

    it('should find rule for new employee (0-5 months)', () => {
      const result = calculationUtils.findApplicableRule(3, mockRules)
      expect(result?.id).toBe('1')
    })

    it('should find rule for mid-service employee (6-23 months)', () => {
      const result = calculationUtils.findApplicableRule(12, mockRules)
      expect(result?.id).toBe('2')
    })

    it('should find rule for long-service employee (24-59 months)', () => {
      const result = calculationUtils.findApplicableRule(36, mockRules)
      expect(result?.id).toBe('3')
    })

    it('should find rule for very long-service employee (60+ months)', () => {
      const result = calculationUtils.findApplicableRule(120, mockRules)
      expect(result?.id).toBe('4')
    })

    it('should return null when no applicable rule found', () => {
      const result = calculationUtils.findApplicableRule(3, [])
      expect(result).toBeNull()
    })

    it('should handle edge case at boundary', () => {
      const result = calculationUtils.findApplicableRule(6, mockRules)
      expect(result?.id).toBe('2') // Should match the 6-23 rule
    })
  })

  describe('calculateEntitlements', () => {
    const mockRule = {
      id: '1',
      min_service_months: 0,
      max_service_months: 12,
      full_pay_amount: 2,
      full_pay_unit: 'weeks' as const,
      half_pay_amount: 3,
      half_pay_unit: 'weeks' as const,
    }

    const mockWorkPattern = [
      { employee_id: 'emp1', day: 'Monday', is_working: true },
      { employee_id: 'emp1', day: 'Tuesday', is_working: true },
      { employee_id: 'emp1', day: 'Wednesday', is_working: true },
      { employee_id: 'emp1', day: 'Thursday', is_working: true },
      { employee_id: 'emp1', day: 'Friday', is_working: true },
      { employee_id: 'emp1', day: 'Saturday', is_working: false },
      { employee_id: 'emp1', day: 'Sunday', is_working: false },
    ]

    it('should calculate entitlements correctly for full-time employee', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_work_patterns', mockWorkPattern)
      )

      const result = await calculationUtils.calculateEntitlements(mockRule, 'emp1')

      expect(result.fullPayDays).toBe(10) // 2 weeks * 5 working days
      expect(result.halfPayDays).toBe(15) // 3 weeks * 5 working days
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_work_patterns', null, new Error('Database error'))
      )

      const result = await calculationUtils.calculateEntitlements(mockRule, 'emp1')

      expect(result.fullPayDays).toBe(10) // Should use default 5 working days
      expect(result.halfPayDays).toBe(15)
    })

    it('should handle empty work pattern', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_work_patterns', [])
      )

      const result = await calculationUtils.calculateEntitlements(mockRule, 'emp1')

      expect(result.fullPayDays).toBe(10) // Should use default 5 working days
      expect(result.halfPayDays).toBe(15)
    })

    it('should calculate entitlements for part-time employee', async () => {
      const partTimePattern = mockWorkPattern.filter((day, index) => index % 2 === 0) // Every other day

      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_work_patterns', partTimePattern)
      )

      const result = await calculationUtils.calculateEntitlements(mockRule, 'emp1')

      expect(result.fullPayDays).toBe(6) // 2 weeks * 3 working days
      expect(result.halfPayDays).toBe(9) // 3 weeks * 3 working days
    })
  })
})