import { describe, it, expect } from 'vitest'
import { 
  countWorkingDaysBetween, 
  calculateWorkingDaysForRecord 
} from '@/components/employees/details/sickness/utils/workingDaysCalculations'
import { WorkDay } from "@/components/employees/details/work-pattern/types"

// Real September 2025 dates for comprehensive testing
const september2025Dates = {
  monday22: '2025-09-22',    // Monday - confirmed working day
  tuesday23: '2025-09-23',   // Tuesday 
  wednesday24: '2025-09-24', // Wednesday
  thursday25: '2025-09-25',  // Thursday
  friday26: '2025-09-26',    // Friday
  saturday27: '2025-09-27',  // Saturday - weekend
  sunday28: '2025-09-28',    // Sunday - weekend
}

// Full-time work pattern (Mon-Fri)
const fullTimePattern: WorkDay[] = [
  { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP001' },
  { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP001' },
]

// Part-time pattern (Mon, Wed, Fri)
const partTimePattern: WorkDay[] = [
  { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP002' },
  { day: 'Tuesday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
  { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP002' },
  { day: 'Thursday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
  { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP002' },
  { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
  { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
]

describe('Working Days Calculations - September 2025 Real World Tests', () => {
  describe('Regression Tests for Klaudia Adamiec Scenario', () => {
    it('should correctly calculate 2 working days for Mon-Tue absence (full-time)', () => {
      // Klaudia's actual scenario: 22/09 (Monday) to 23/09 (Tuesday)
      const result = countWorkingDaysBetween(
        september2025Dates.monday22,
        september2025Dates.tuesday23,
        fullTimePattern
      )
      expect(result).toBe(2) // Both Monday and Tuesday are working days
    })

    it('should correctly handle single day absence on working day', () => {
      const result = calculateWorkingDaysForRecord(
        september2025Dates.monday22,
        null, // no end date
        fullTimePattern
      )
      expect(result).toBe(1) // Monday is a working day
    })
  })

  describe('Regression Tests for Karen Cross Scenario', () => {
    it('should correctly calculate 3 working days for Mon-Fri absence (part-time Mon/Wed/Fri)', () => {
      // Karen's corrected scenario: 22/09 (Monday) to 26/09 (Friday)
      const result = countWorkingDaysBetween(
        september2025Dates.monday22,
        september2025Dates.friday26,
        partTimePattern
      )
      expect(result).toBe(3) // Monday, Wednesday, Friday are working days for part-time
    })

    it('should correctly calculate 5 working days for Mon-Fri absence (full-time)', () => {
      // Same date range but full-time pattern
      const result = countWorkingDaysBetween(
        september2025Dates.monday22,
        september2025Dates.friday26,
        fullTimePattern
      )
      expect(result).toBe(5) // All weekdays are working days for full-time
    })
  })

  describe('Cross-validation Tests', () => {
    it('should match stored vs calculated working days for various scenarios', () => {
      const scenarios = [
        {
          name: 'Single working day',
          start: september2025Dates.monday22,
          end: september2025Dates.monday22,
          pattern: fullTimePattern,
          expected: 1
        },
        {
          name: 'Working week (Mon-Fri)',
          start: september2025Dates.monday22,
          end: september2025Dates.friday26,
          pattern: fullTimePattern,
          expected: 5
        },
        {
          name: 'Including weekend (Mon-Sun)',
          start: september2025Dates.monday22,
          end: september2025Dates.sunday28,
          pattern: fullTimePattern,
          expected: 5 // Only weekdays count
        },
        {
          name: 'Weekend only (Sat-Sun)',
          start: september2025Dates.saturday27,
          end: september2025Dates.sunday28,
          pattern: fullTimePattern,
          expected: 0 // No working days
        },
        {
          name: 'Part-time Mon-Wed-Fri pattern',
          start: september2025Dates.monday22,
          end: september2025Dates.friday26,
          pattern: partTimePattern,
          expected: 3 // Only Mon, Wed, Fri
        }
      ]

      scenarios.forEach(scenario => {
        const result = countWorkingDaysBetween(
          scenario.start,
          scenario.end,
          scenario.pattern
        )
        expect(result).toBe(scenario.expected)
      })
    })
  })

  describe('Edge Case Prevention', () => {
    it('should handle date parsing edge cases', () => {
      // Test different date formats
      const formats = [
        '2025-09-22',
        '2025/09/22',
        'September 22, 2025'
      ]

      // Note: Our function expects ISO date strings, so only the first should work
      const validResult = countWorkingDaysBetween(
        formats[0],
        formats[0],
        fullTimePattern
      )
      expect(validResult).toBe(1)
    })

    it('should prevent obviously invalid working days', () => {
      // Test impossible scenarios
      expect(countWorkingDaysBetween('', '', fullTimePattern)).toBe(0)
      expect(countWorkingDaysBetween('invalid', 'dates', fullTimePattern)).toBe(0)
      expect(countWorkingDaysBetween(
        september2025Dates.friday26,
        september2025Dates.monday22, // end before start
        fullTimePattern
      )).toBe(0)
    })

    it('should handle empty or invalid work patterns gracefully', () => {
      expect(countWorkingDaysBetween(
        september2025Dates.monday22,
        september2025Dates.friday26,
        [] // empty pattern
      )).toBe(0)

      expect(countWorkingDaysBetween(
        september2025Dates.monday22,
        september2025Dates.friday26,
        null as any // null pattern
      )).toBe(0)
    })
  })

  describe('September 2025 Day Validation', () => {
    it('should correctly identify September 22, 2025 as Monday', () => {
      const date = new Date('2025-09-22')
      expect(date.getDay()).toBe(1) // 1 = Monday (0 = Sunday)
    })

    it('should correctly identify all September 2025 test dates', () => {
      const expectedDays = {
        '2025-09-22': 1, // Monday
        '2025-09-23': 2, // Tuesday
        '2025-09-24': 3, // Wednesday
        '2025-09-25': 4, // Thursday
        '2025-09-26': 5, // Friday
        '2025-09-27': 6, // Saturday
        '2025-09-28': 0, // Sunday
      }

      Object.entries(expectedDays).forEach(([dateStr, expectedDay]) => {
        const date = new Date(dateStr)
        expect(date.getDay()).toBe(expectedDay)
      })
    })
  })
})