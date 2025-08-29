import { describe, it, expect } from 'vitest'
import { 
  countWorkingDaysBetween, 
  calculateWorkingDaysForRecord 
} from '@/components/employees/details/sickness/utils/workingDaysCalculations'
import { 
  mockWorkPatternFullTime, 
  mockWorkPatternPartTime 
} from '@/test-utils/workPatterns'
import { testDates } from '@/test-utils/date'

describe('workingDaysCalculations', () => {
  describe('countWorkingDaysBetween', () => {
    it('should count working days correctly for a full week', () => {
      // Monday to Friday (5 working days)
      const result = countWorkingDaysBetween(
        testDates.monday,
        testDates.friday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(5)
    })

    it('should count working days including weekend for full-time pattern', () => {
      // Monday to Sunday (5 working days, weekend excluded)
      const result = countWorkingDaysBetween(
        testDates.monday,
        testDates.sunday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(5)
    })

    it('should count working days for part-time pattern', () => {
      // Monday to Friday for part-time (Mon, Wed, Fri working = 3 days)
      const result = countWorkingDaysBetween(
        testDates.monday,
        testDates.friday,
        mockWorkPatternPartTime
      )
      expect(result).toBe(3)
    })

    it('should return 0 when start date is after end date', () => {
      const result = countWorkingDaysBetween(
        testDates.friday,
        testDates.monday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(0)
    })

    it('should return 0 when no work pattern provided', () => {
      const result = countWorkingDaysBetween(
        testDates.monday,
        testDates.friday,
        []
      )
      expect(result).toBe(0)
    })

    it('should return 1 for same day when it is a working day', () => {
      const result = countWorkingDaysBetween(
        testDates.monday,
        testDates.monday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(1)
    })

    it('should return 0 for same day when it is not a working day', () => {
      const result = countWorkingDaysBetween(
        testDates.saturday,
        testDates.saturday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(0)
    })

    it('should handle empty start or end date', () => {
      const result = countWorkingDaysBetween(
        '',
        testDates.friday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(0)
    })
  })

  describe('calculateWorkingDaysForRecord', () => {
    it('should calculate working days when both start and end dates provided', () => {
      const result = calculateWorkingDaysForRecord(
        testDates.monday,
        testDates.friday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(5)
    })

    it('should return 1 when no end date and start date is working day', () => {
      const result = calculateWorkingDaysForRecord(
        testDates.monday,
        null,
        mockWorkPatternFullTime
      )
      expect(result).toBe(1)
    })

    it('should return 0 when no end date and start date is not working day', () => {
      const result = calculateWorkingDaysForRecord(
        testDates.saturday,
        null,
        mockWorkPatternFullTime
      )
      expect(result).toBe(0)
    })

    it('should return 0 when no start date provided', () => {
      const result = calculateWorkingDaysForRecord(
        '',
        testDates.friday,
        mockWorkPatternFullTime
      )
      expect(result).toBe(0)
    })

    it('should return 0 when no work pattern provided', () => {
      const result = calculateWorkingDaysForRecord(
        testDates.monday,
        testDates.friday,
        []
      )
      expect(result).toBe(0)
    })

    it('should handle undefined end date', () => {
      const result = calculateWorkingDaysForRecord(
        testDates.monday,
        undefined,
        mockWorkPatternFullTime
      )
      expect(result).toBe(1)
    })
  })
})