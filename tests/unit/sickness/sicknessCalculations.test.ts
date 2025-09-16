import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateSicknessEntitlementSummary } from '@/utils/sicknessCalculations'
import { Employee } from '@/types/employee-types'

// Mock the sickness service
const mockSicknessService = {
  getEntitlementUsage: vi.fn(),
  calculateUsedDays: vi.fn(),
  calculateRolling12MonthUsage: vi.fn(),
  calculateSspUsage: vi.fn(),
  getRolling12MonthPeriod: vi.fn(),
  calculateRolling12MonthUsageFromDate: vi.fn(),
  calculateSspUsageFromDate: vi.fn(),
}

vi.mock('@/services/sicknessService', () => ({
  sicknessService: mockSicknessService,
}))

describe('sicknessCalculations', () => {
  const mockEmployee: Employee = {
    id: 'emp1',
    first_name: 'John',
    last_name: 'Doe',
    payroll_id: 'EMP001',
    email: 'john.doe@example.com',
    hire_date: '2023-01-01',
    status: 'active',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateSicknessEntitlementSummary', () => {
    it('should calculate entitlement summary correctly', async () => {
      // Mock data
      const mockEntitlementUsage = {
        full_pay_entitled_days: 50,
        half_pay_entitled_days: 75,
        current_rule_id: 'tier2',
        current_service_months: 18,
      }

      const mockYearUsage = { totalUsed: 10 }
      const mockRollingUsage = { totalUsed: 25 }
      const mockSspUsage = {
        sspEntitledDays: 140,
        sspUsedRolling12: 15,
      }

      const mockRollingPeriod = {
        start: '2023-06-16',
        end: '2024-06-15',
      }

      // Setup mocks
      mockSicknessService.getEntitlementUsage.mockResolvedValue(mockEntitlementUsage)
      mockSicknessService.calculateUsedDays.mockResolvedValue(mockYearUsage)
      mockSicknessService.calculateRolling12MonthUsage.mockResolvedValue(mockRollingUsage)
      mockSicknessService.calculateSspUsage.mockResolvedValue(mockSspUsage)
      mockSicknessService.getRolling12MonthPeriod.mockReturnValue(mockRollingPeriod)

      const result = await calculateSicknessEntitlementSummary(mockEmployee)

      expect(result).toEqual({
        full_pay_remaining: 25, // 50 - 25 (allocated from rolling usage)
        half_pay_remaining: 75, // No half pay used yet
        full_pay_used_rolling_12_months: 25, // All rolling usage allocated to full pay
        half_pay_used_rolling_12_months: 0,
        total_used_rolling_12_months: 25,
        current_tier: 'tier2',
        service_months: 18,
        rolling_period_start: '2023-06-16',
        rolling_period_end: '2024-06-15',
        ssp_entitled_days: 140,
        ssp_used_rolling_12_months: 15,
        ssp_remaining_days: 125, // 140 - 15
      })
    })

    it('should handle case where rolling usage exceeds full pay allowance', async () => {
      const mockEntitlementUsage = {
        full_pay_entitled_days: 20,
        half_pay_entitled_days: 30,
        current_rule_id: 'tier1',
        current_service_months: 6,
      }

      const mockYearUsage = { totalUsed: 5 }
      const mockRollingUsage = { totalUsed: 35 } // Exceeds full pay allowance
      const mockSspUsage = {
        sspEntitledDays: 140,
        sspUsedRolling12: 20,
      }

      const mockRollingPeriod = {
        start: '2023-06-16',
        end: '2024-06-15',
      }

      mockSicknessService.getEntitlementUsage.mockResolvedValue(mockEntitlementUsage)
      mockSicknessService.calculateUsedDays.mockResolvedValue(mockYearUsage)
      mockSicknessService.calculateRolling12MonthUsage.mockResolvedValue(mockRollingUsage)
      mockSicknessService.calculateSspUsage.mockResolvedValue(mockSspUsage)
      mockSicknessService.getRolling12MonthPeriod.mockReturnValue(mockRollingPeriod)

      const result = await calculateSicknessEntitlementSummary(mockEmployee)

      expect(result).toEqual({
        full_pay_remaining: 0, // All used up
        half_pay_remaining: 15, // 30 - 15 (overflow from full pay)
        full_pay_used_rolling_12_months: 20, // Full allowance used
        half_pay_used_rolling_12_months: 15, // Overflow: 35 - 20 = 15
        total_used_rolling_12_months: 35,
        current_tier: 'tier1',
        service_months: 6,
        rolling_period_start: '2023-06-16',
        rolling_period_end: '2024-06-15',
        ssp_entitled_days: 140,
        ssp_used_rolling_12_months: 20,
        ssp_remaining_days: 120,
      })
    })

    it('should return null when entitlement usage is not found', async () => {
      mockSicknessService.getEntitlementUsage.mockResolvedValue(null)

      const result = await calculateSicknessEntitlementSummary(mockEmployee)

      expect(result).toBeNull()
    })

    it('should handle missing entitlement data gracefully', async () => {
      const mockEntitlementUsage = {
        full_pay_entitled_days: null,
        half_pay_entitled_days: null,
        current_rule_id: null,
        current_service_months: 0,
      }

      const mockYearUsage = { totalUsed: 0 }
      const mockRollingUsage = { totalUsed: 0 }
      const mockSspUsage = {
        sspEntitledDays: 140,
        sspUsedRolling12: 0,
      }

      const mockRollingPeriod = {
        start: '2023-06-16',
        end: '2024-06-15',
      }

      mockSicknessService.getEntitlementUsage.mockResolvedValue(mockEntitlementUsage)
      mockSicknessService.calculateUsedDays.mockResolvedValue(mockYearUsage)
      mockSicknessService.calculateRolling12MonthUsage.mockResolvedValue(mockRollingUsage)
      mockSicknessService.calculateSspUsage.mockResolvedValue(mockSspUsage)
      mockSicknessService.getRolling12MonthPeriod.mockReturnValue(mockRollingPeriod)

      const result = await calculateSicknessEntitlementSummary(mockEmployee)

      expect(result).toEqual({
        full_pay_remaining: 0,
        half_pay_remaining: 0,
        full_pay_used_rolling_12_months: 0,
        half_pay_used_rolling_12_months: 0,
        total_used_rolling_12_months: 0,
        current_tier: 'No tier',
        service_months: 0,
        rolling_period_start: '2023-06-16',
        rolling_period_end: '2024-06-15',
        ssp_entitled_days: 140,
        ssp_used_rolling_12_months: 0,
        ssp_remaining_days: 140,
      })
    })

    it('should handle errors gracefully and return null', async () => {
      mockSicknessService.getEntitlementUsage.mockRejectedValue(new Error('Database error'))

      const result = await calculateSicknessEntitlementSummary(mockEmployee)

      expect(result).toBeNull()
    })

    it('should handle missing or undefined usage data', async () => {
      const mockEntitlementUsage = {
        full_pay_entitled_days: 50,
        half_pay_entitled_days: 75,
        current_rule_id: 'tier2',
        current_service_months: 18,
      }

      mockSicknessService.getEntitlementUsage.mockResolvedValue(mockEntitlementUsage)
      mockSicknessService.calculateUsedDays.mockResolvedValue({ totalUsed: undefined })
      mockSicknessService.calculateRolling12MonthUsage.mockResolvedValue({ totalUsed: null })
      mockSicknessService.calculateSspUsage.mockResolvedValue({
        sspEntitledDays: 140,
        sspUsedRolling12: undefined,
      })
      mockSicknessService.getRolling12MonthPeriod.mockReturnValue({
        start: '2023-06-16',
        end: '2024-06-15',
      })

      const result = await calculateSicknessEntitlementSummary(mockEmployee)

      expect(result?.total_used_rolling_12_months).toBe(0)
      expect(result?.ssp_used_rolling_12_months).toBe(0)
      expect(result?.ssp_remaining_days).toBe(140)
    })

    it('should use reference date when provided', async () => {
      const referenceDate = '2025-08-30'
      
      const mockEntitlementUsage = {
        full_pay_entitled_days: 30,
        half_pay_entitled_days: 40,
        current_rule_id: 'tier3',
        current_service_months: 24,
      }

      const mockYearUsage = { totalUsed: 5 }
      const mockRollingUsage = { totalUsed: 8 }
      const mockSspUsage = {
        sspEntitledDays: 140,
        sspUsedRolling12: 3,
      }

      const mockRollingPeriod = {
        start: '2024-08-31',
        end: '2025-08-30',
      }

      mockSicknessService.getEntitlementUsage.mockResolvedValue(mockEntitlementUsage)
      mockSicknessService.calculateUsedDays.mockResolvedValue(mockYearUsage)
      mockSicknessService.calculateRolling12MonthUsageFromDate.mockResolvedValue(mockRollingUsage)
      mockSicknessService.calculateSspUsageFromDate.mockResolvedValue(mockSspUsage)
      mockSicknessService.getRolling12MonthPeriod.mockReturnValue(mockRollingPeriod)

      const result = await calculateSicknessEntitlementSummary(mockEmployee, referenceDate)

      expect(mockSicknessService.calculateRolling12MonthUsageFromDate).toHaveBeenCalledWith('emp1', referenceDate)
      expect(mockSicknessService.calculateSspUsageFromDate).toHaveBeenCalledWith('emp1', referenceDate)
      expect(mockSicknessService.getRolling12MonthPeriod).toHaveBeenCalledWith(referenceDate)

      expect(result).toEqual({
        full_pay_remaining: 22, // 30 - 8
        half_pay_remaining: 40, // No half pay used
        full_pay_used_rolling_12_months: 8,
        half_pay_used_rolling_12_months: 0,
        total_used_rolling_12_months: 8,
        current_tier: 'tier3',
        service_months: 24,
        rolling_period_start: '2024-08-31',
        rolling_period_end: '2025-08-30',
        ssp_entitled_days: 140,
        ssp_used_rolling_12_months: 3,
        ssp_remaining_days: 137,
      })
    })
  })
})