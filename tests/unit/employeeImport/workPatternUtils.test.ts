import { describe, it, expect, vi } from 'vitest'
import { 
  prepareWorkPatterns, 
  prepareWorkPatternsForInsert 
} from '@/services/employeeImport/workPatternUtils'
import { WorkDay } from '@/components/employees/details/work-pattern/types'

// Mock the dependencies
vi.mock('@/services/employeeImport/payrollIdUtils', () => ({
  normalizePayrollId: vi.fn((id) => id?.toString() || null),
}))

vi.mock('@/types/employee', () => ({
  defaultWorkPattern: [
    { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Saturday', isWorking: false, startTime: null, endTime: null },
    { day: 'Sunday', isWorking: false, startTime: null, endTime: null },
  ],
}))

vi.mock('@/components/employees/import/ImportUtils', () => ({
  extractWorkPatternWithPayrollId: vi.fn(),
}))

import { normalizePayrollId } from '@/services/employeeImport/payrollIdUtils'
import { extractWorkPatternWithPayrollId } from '@/components/employees/import/ImportUtils'

describe('workPatternUtils', () => {
  describe('prepareWorkPatterns', () => {
    it('should use default work pattern with payroll ID', () => {
      const employeeData = { payroll_id: 'EMP001' }
      
      vi.mocked(extractWorkPatternWithPayrollId).mockReturnValue(null)

      const result = prepareWorkPatterns(employeeData)

      expect(result).toHaveLength(7) // 7 days
      expect(result[0].payrollId).toBe('EMP001')
      expect(result[0].day).toBe('Monday')
      expect(result[0].isWorking).toBe(true)
      expect(result[5].day).toBe('Saturday')
      expect(result[5].isWorking).toBe(false)
    })

    it('should use extracted work pattern when available', () => {
      const employeeData = { payroll_id: 'EMP002' }
      const customPattern: WorkDay[] = [
        { day: 'Monday', isWorking: true, startTime: '08:00', endTime: '16:00', payrollId: 'EMP002' },
        { day: 'Tuesday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
        { day: 'Wednesday', isWorking: true, startTime: '08:00', endTime: '16:00', payrollId: 'EMP002' },
        { day: 'Thursday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
        { day: 'Friday', isWorking: true, startTime: '08:00', endTime: '16:00', payrollId: 'EMP002' },
        { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
        { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
      ]

      vi.mocked(extractWorkPatternWithPayrollId).mockReturnValue(customPattern)

      const result = prepareWorkPatterns(employeeData)

      expect(result).toEqual(customPattern)
      expect(result[0].startTime).toBe('08:00')
      expect(result[1].isWorking).toBe(false)
    })

    it('should handle null payroll ID', () => {
      const employeeData = { payroll_id: null }
      
      vi.mocked(normalizePayrollId).mockReturnValue(null)
      vi.mocked(extractWorkPatternWithPayrollId).mockReturnValue(null)

      const result = prepareWorkPatterns(employeeData)

      expect(result).toHaveLength(7)
      expect(result[0].payrollId).toBeNull()
    })

    it('should normalize payroll ID before using', () => {
      const employeeData = { payroll_id: '  EMP003  ' }
      
      vi.mocked(normalizePayrollId).mockReturnValue('EMP003')
      vi.mocked(extractWorkPatternWithPayrollId).mockReturnValue(null)

      prepareWorkPatterns(employeeData)

      expect(normalizePayrollId).toHaveBeenCalledWith('  EMP003  ')
    })
  })

  describe('prepareWorkPatternsForInsert', () => {
    const mockWorkPatterns: WorkDay[] = [
      { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
      { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
      { day: 'Wednesday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP001' },
    ]

    it('should convert work patterns to database insert format', () => {
      const result = prepareWorkPatternsForInsert(mockWorkPatterns, 'emp-uuid-123', 'EMP001')

      expect(result).toEqual([
        {
          employee_id: 'emp-uuid-123',
          day: 'Monday',
          is_working: true,
          start_time: '09:00',
          end_time: '17:00',
          payroll_id: 'EMP001',
        },
        {
          employee_id: 'emp-uuid-123',
          day: 'Tuesday',
          is_working: true,
          start_time: '09:00',
          end_time: '17:00',
          payroll_id: 'EMP001',
        },
        {
          employee_id: 'emp-uuid-123',
          day: 'Wednesday',
          is_working: false,
          start_time: null,
          end_time: null,
          payroll_id: 'EMP001',
        },
      ])
    })

    it('should handle null payroll ID', () => {
      const result = prepareWorkPatternsForInsert(mockWorkPatterns, 'emp-uuid-123', null)

      expect(result[0].payroll_id).toBeNull()
      expect(result[1].payroll_id).toBeNull()
      expect(result[2].payroll_id).toBeNull()
    })

    it('should handle empty work patterns array', () => {
      const result = prepareWorkPatternsForInsert([], 'emp-uuid-123', 'EMP001')

      expect(result).toEqual([])
    })

    it('should preserve all work pattern properties', () => {
      const complexPattern: WorkDay[] = [
        { 
          day: 'Monday', 
          isWorking: true, 
          startTime: '08:30', 
          endTime: '17:30', 
          payrollId: 'EMP001' 
        },
      ]

      const result = prepareWorkPatternsForInsert(complexPattern, 'emp-uuid-456', 'EMP001')

      expect(result[0]).toEqual({
        employee_id: 'emp-uuid-456',
        day: 'Monday',
        is_working: true,
        start_time: '08:30',
        end_time: '17:30',
        payroll_id: 'EMP001',
      })
    })

    it('should handle patterns with different payroll IDs in pattern vs parameter', () => {
      const patternsWithDifferentIds: WorkDay[] = [
        { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'OLD_ID' },
      ]

      const result = prepareWorkPatternsForInsert(patternsWithDifferentIds, 'emp-uuid-789', 'NEW_ID')

      expect(result[0].payroll_id).toBe('NEW_ID') // Should use the parameter value
    })
  })
})