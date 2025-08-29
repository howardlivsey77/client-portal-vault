import { describe, it, expect, vi, beforeEach } from 'vitest'
import { balanceService } from '@/services/sickness/balanceService'
import { mockSupabase, mockSupabaseFrom } from '@/test-utils/supabaseMock'
import { testDates } from '@/test-utils/date'

// Mock the calculationUtils
vi.mock('@/services/sickness/calculationUtils', () => ({
  calculationUtils: {
    getRolling12MonthPeriod: vi.fn(() => ({
      start: '2023-06-16',
      end: '2024-06-15'
    }))
  }
}))

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

describe('balanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHistoricalBalances', () => {
    it('should fetch historical balances for employee', async () => {
      const mockBalances = [
        { 
          employee_id: 'emp1', 
          balance_date: '2024-01-01', 
          full_pay_remaining: 10, 
          half_pay_remaining: 15 
        },
        { 
          employee_id: 'emp1', 
          balance_date: '2023-12-01', 
          full_pay_remaining: 12, 
          half_pay_remaining: 18 
        },
      ]

      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_historical_balances', mockBalances)
      )

      const result = await balanceService.getHistoricalBalances('emp1')

      expect(mockSupabase.from).toHaveBeenCalledWith('employee_sickness_historical_balances')
      expect(result).toEqual(mockBalances)
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_historical_balances', null, new Error('Database error'))
      )

      await expect(balanceService.getHistoricalBalances('emp1')).rejects.toThrow('Database error')
    })

    it('should return empty array when no data', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_historical_balances', null)
      )

      const result = await balanceService.getHistoricalBalances('emp1')
      expect(result).toEqual([])
    })
  })

  describe('calculateRolling12MonthUsage', () => {
    it('should calculate usage for overlapping sickness records', async () => {
      const mockRecords = [
        { 
          total_days: 5, 
          start_date: '2024-01-15', 
          end_date: '2024-01-19' 
        },
        { 
          total_days: 3, 
          start_date: '2024-03-01', 
          end_date: '2024-03-03' 
        },
        { 
          total_days: 2, 
          start_date: '2023-05-01', // Before range, should be excluded
          end_date: '2023-05-02' 
        },
      ]

      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', mockRecords)
      )

      const result = await balanceService.calculateRolling12MonthUsage('emp1')

      expect(result.totalUsed).toBe(8) // 5 + 3, excluding the pre-range record
      expect(result.fullPayUsed).toBe(8)
      expect(result.halfPayUsed).toBe(0)
    })

    it('should handle records that partially overlap the range', async () => {
      const mockRecords = [
        { 
          total_days: 10, 
          start_date: '2023-06-10', // Starts before range
          end_date: '2023-06-20'   // Ends within range
        },
      ]

      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', mockRecords)
      )

      const result = await balanceService.calculateRolling12MonthUsage('emp1')

      expect(result.totalUsed).toBe(10) // Should include overlapping record
    })

    it('should handle empty sickness records', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', [])
      )

      const result = await balanceService.calculateRolling12MonthUsage('emp1')

      expect(result.totalUsed).toBe(0)
      expect(result.fullPayUsed).toBe(0)
      expect(result.halfPayUsed).toBe(0)
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', null, new Error('Database error'))
      )

      await expect(balanceService.calculateRolling12MonthUsage('emp1')).rejects.toThrow('Database error')
    })
  })

  describe('calculateUsedDays', () => {
    it('should calculate used days for current year', async () => {
      const mockRecords = [
        { total_days: 5, start_date: '2024-01-15' },
        { total_days: 3, start_date: '2024-06-01' },
        { total_days: 2, start_date: '2023-12-01' }, // Previous year, should be excluded
      ]

      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', mockRecords.slice(0, 2)) // Mock excludes previous year
      )

      const result = await balanceService.calculateUsedDays('emp1')

      expect(result.totalUsed).toBe(8) // 5 + 3
      expect(result.fullPayUsed).toBe(0) // Not allocated at this level
      expect(result.halfPayUsed).toBe(0)
    })

    it('should handle null total_days', async () => {
      const mockRecords = [
        { total_days: null, start_date: '2024-01-15' },
        { total_days: 5, start_date: '2024-06-01' },
      ]

      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', mockRecords)
      )

      const result = await balanceService.calculateUsedDays('emp1')

      expect(result.totalUsed).toBe(5) // Should handle null values
    })

    it('should handle empty records', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', [])
      )

      const result = await balanceService.calculateUsedDays('emp1')

      expect(result.totalUsed).toBe(0)
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue(
        mockSupabaseFrom('employee_sickness_records', null, new Error('Database error'))
      )

      await expect(balanceService.calculateUsedDays('emp1')).rejects.toThrow('Database error')
    })
  })
})