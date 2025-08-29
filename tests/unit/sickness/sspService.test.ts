import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sspService } from '@/services/sickness/sspService'
import { mockSupabase, mockSupabaseFrom } from '@/test-utils/supabaseMock'
import { mockDate, restoreDate } from '@/test-utils/date'

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

describe('sspService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDate('2024-06-15') // Set consistent test date
  })

  afterEach(() => {
    restoreDate()
  })

  describe('calculateSspUsage', () => {
    const mockWorkPattern = [
      { employee_id: 'emp1', day: 'Monday', is_working: true },
      { employee_id: 'emp1', day: 'Tuesday', is_working: true },
      { employee_id: 'emp1', day: 'Wednesday', is_working: true },
      { employee_id: 'emp1', day: 'Thursday', is_working: true },
      { employee_id: 'emp1', day: 'Friday', is_working: true },
      { employee_id: 'emp1', day: 'Saturday', is_working: false },
      { employee_id: 'emp1', day: 'Sunday', is_working: false },
    ]

    const mockSicknessRecords = [
      {
        start_date: '2024-01-15',
        end_date: '2024-01-19', // 5-day period (Mon-Fri)
        employee_id: 'emp1'
      },
      {
        start_date: '2024-03-01',
        end_date: '2024-03-05', // Another 5-day period
        employee_id: 'emp1'
      }
    ]

    it('should calculate SSP usage correctly for full-time employee', async () => {
      // Setup mocks
      mockSupabase.from
        .mockReturnValueOnce(mockSupabaseFrom('employee_work_patterns', mockWorkPattern))
        .mockReturnValueOnce(mockSupabaseFrom('employee_sickness_records', mockSicknessRecords))

      const result = await sspService.calculateSspUsage('emp1')

      expect(result.qualifyingDaysPerWeek).toBe(5) // 5 working days
      expect(result.sspEntitledDays).toBe(140) // 28 weeks * 5 days
      expect(result.sspUsedCurrentYear).toBeGreaterThan(0) // Should have some usage
      expect(result.sspUsedRolling12).toBeGreaterThan(0) // Should have some usage
    })

    it('should handle part-time work patterns', async () => {
      const partTimePattern = mockWorkPattern.filter(day => 
        ['Monday', 'Wednesday', 'Friday'].includes(day.day)
      ).map(day => ({ ...day, is_working: day.day !== 'Wednesday' ? true : false }))

      mockSupabase.from
        .mockReturnValueOnce(mockSupabaseFrom('employee_work_patterns', partTimePattern))
        .mockReturnValueOnce(mockSupabaseFrom('employee_sickness_records', mockSicknessRecords))

      const result = await sspService.calculateSspUsage('emp1')

      expect(result.qualifyingDaysPerWeek).toBe(2) // Only 2 working days
      expect(result.sspEntitledDays).toBe(56) // 28 weeks * 2 days
    })

    it('should handle employees with no sickness records', async () => {
      mockSupabase.from
        .mockReturnValueOnce(mockSupabaseFrom('employee_work_patterns', mockWorkPattern))
        .mockReturnValueOnce(mockSupabaseFrom('employee_sickness_records', []))

      const result = await sspService.calculateSspUsage('emp1')

      expect(result.qualifyingDaysPerWeek).toBe(5)
      expect(result.sspEntitledDays).toBe(140)
      expect(result.sspUsedCurrentYear).toBe(0)
      expect(result.sspUsedRolling12).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from
        .mockReturnValueOnce(mockSupabaseFrom('employee_work_patterns', null, new Error('DB Error')))
        .mockReturnValueOnce(mockSupabaseFrom('employee_sickness_records', []))

      const result = await sspService.calculateSspUsage('emp1')

      // Should use defaults when work pattern fetch fails
      expect(result.qualifyingDaysPerWeek).toBe(5) // Default
      expect(result.sspEntitledDays).toBe(140)
    })

    it('should handle short sickness periods (< 4 days) - no SSP entitlement', async () => {
      const shortSicknessRecords = [
        {
          start_date: '2024-01-15',
          end_date: '2024-01-16', // Only 2 days
          employee_id: 'emp1'
        }
      ]

      mockSupabase.from
        .mockReturnValueOnce(mockSupabaseFrom('employee_work_patterns', mockWorkPattern))
        .mockReturnValueOnce(mockSupabaseFrom('employee_sickness_records', shortSicknessRecords))

      const result = await sspService.calculateSspUsage('emp1')

      expect(result.sspUsedCurrentYear).toBe(0) // Short periods don't qualify for SSP
      expect(result.sspUsedRolling12).toBe(0)
    })

    it('should handle linked sickness periods (within 56 days)', async () => {
      const linkedSicknessRecords = [
        {
          start_date: '2024-01-15',
          end_date: '2024-01-19', // 5 days
          employee_id: 'emp1'
        },
        {
          start_date: '2024-02-01', // Within 56 days of first period
          end_date: '2024-02-05', // 5 days
          employee_id: 'emp1'
        }
      ]

      mockSupabase.from
        .mockReturnValueOnce(mockSupabaseFrom('employee_work_patterns', mockWorkPattern))
        .mockReturnValueOnce(mockSupabaseFrom('employee_sickness_records', linkedSicknessRecords))

      const result = await sspService.calculateSspUsage('emp1')

      // Linked periods should be counted together for SSP
      expect(result.sspUsedCurrentYear).toBeGreaterThan(0)
      expect(result.sspUsedRolling12).toBeGreaterThan(0)
    })

    it('should respect SSP maximum entitlement per chain', async () => {
      // Create a very long sickness period that would exceed SSP limits
      const longSicknessRecords = [
        {
          start_date: '2024-01-01',
          end_date: '2024-12-31', // Entire year
          employee_id: 'emp1'
        }
      ]

      mockSupabase.from
        .mockReturnValueOnce(mockSupabaseFrom('employee_work_patterns', mockWorkPattern))
        .mockReturnValueOnce(mockSupabaseFrom('employee_sickness_records', longSicknessRecords))

      const result = await sspService.calculateSspUsage('emp1')

      // Should not exceed maximum SSP entitlement (28 weeks * working days per week)
      expect(result.sspUsedCurrentYear).toBeLessThanOrEqual(result.sspEntitledDays)
      expect(result.sspUsedRolling12).toBeLessThanOrEqual(result.sspEntitledDays)
    })
  })
})