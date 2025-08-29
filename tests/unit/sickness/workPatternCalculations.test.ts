import { describe, it, expect } from 'vitest'
import { 
  calculateWorkingDaysPerWeek, 
  convertMonthsToDays, 
  convertEntitlementToDays 
} from '@/components/employees/details/sickness/utils/workPatternCalculations'
import { 
  mockWorkPatternFullTime, 
  mockWorkPatternPartTime, 
  mockWorkPattern4Day 
} from '@/test-utils/workPatterns'

describe('workPatternCalculations', () => {
  describe('calculateWorkingDaysPerWeek', () => {
    it('should calculate 5 working days for full-time pattern', () => {
      const result = calculateWorkingDaysPerWeek(mockWorkPatternFullTime)
      expect(result).toBe(5)
    })

    it('should calculate 3 working days for part-time pattern', () => {
      const result = calculateWorkingDaysPerWeek(mockWorkPatternPartTime)
      expect(result).toBe(3)
    })

    it('should calculate 4 working days for 4-day pattern', () => {
      const result = calculateWorkingDaysPerWeek(mockWorkPattern4Day)
      expect(result).toBe(4)
    })

    it('should default to 5 days when no pattern provided', () => {
      const result = calculateWorkingDaysPerWeek([])
      expect(result).toBe(5)
    })

    it('should default to 5 days when null pattern provided', () => {
      const result = calculateWorkingDaysPerWeek(null as any)
      expect(result).toBe(5)
    })
  })

  describe('convertMonthsToDays', () => {
    it('should convert months to days correctly for full-time (5 days)', () => {
      // 5 * 52.14 / 12 = 21.725 days per month
      // 3 months = 65.175 days, floored = 65 days
      const result = convertMonthsToDays(3, 5)
      expect(result).toBe(65)
    })

    it('should convert months to days correctly for part-time (3 days)', () => {
      // 3 * 52.14 / 12 = 13.035 days per month
      // 6 months = 78.21 days, floored = 78 days
      const result = convertMonthsToDays(6, 3)
      expect(result).toBe(78)
    })

    it('should handle zero months', () => {
      const result = convertMonthsToDays(0, 5)
      expect(result).toBe(0)
    })

    it('should handle fractional months', () => {
      const result = convertMonthsToDays(1.5, 5)
      expect(result).toBe(32) // 1.5 * 21.725 = 32.5875, floored = 32
    })
  })

  describe('convertEntitlementToDays', () => {
    it('should return days as-is when unit is days', () => {
      const result = convertEntitlementToDays(10, 'days', 5)
      expect(result).toBe(10)
    })

    it('should convert weeks to days correctly', () => {
      const result = convertEntitlementToDays(2, 'weeks', 5)
      expect(result).toBe(10) // 2 weeks * 5 days = 10 days
    })

    it('should convert weeks to days for part-time', () => {
      const result = convertEntitlementToDays(3, 'weeks', 3)
      expect(result).toBe(9) // 3 weeks * 3 days = 9 days
    })

    it('should convert months to days correctly', () => {
      const result = convertEntitlementToDays(3, 'months', 5)
      expect(result).toBe(65) // Same as convertMonthsToDays test
    })

    it('should handle zero entitlement', () => {
      const result = convertEntitlementToDays(0, 'weeks', 5)
      expect(result).toBe(0)
    })

    it('should default to days for unknown unit', () => {
      const result = convertEntitlementToDays(10, 'unknown' as any, 5)
      expect(result).toBe(10)
    })
  })
})