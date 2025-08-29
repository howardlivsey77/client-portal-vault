import { describe, it, expect } from 'vitest'
import { 
  normalizePayrollId, 
  extractValidPayrollIds, 
  extractNewPayrollIds 
} from '@/services/employeeImport/payrollIdUtils'

describe('payrollIdUtils', () => {
  describe('normalizePayrollId', () => {
    it('should normalize valid string payroll IDs', () => {
      expect(normalizePayrollId('EMP001')).toBe('EMP001')
      expect(normalizePayrollId('  EMP002  ')).toBe('EMP002')
      expect(normalizePayrollId('123')).toBe('123')
    })

    it('should handle numeric payroll IDs', () => {
      expect(normalizePayrollId(123)).toBe('123')
      expect(normalizePayrollId(0)).toBe('0')
    })

    it('should return null for null/undefined inputs', () => {
      expect(normalizePayrollId(null)).toBeNull()
      expect(normalizePayrollId(undefined)).toBeNull()
    })

    it('should return null for empty strings', () => {
      expect(normalizePayrollId('')).toBeNull()
      expect(normalizePayrollId('   ')).toBeNull()
    })

    it('should handle edge cases', () => {
      expect(normalizePayrollId({})).toBe('[object Object]')
      expect(normalizePayrollId([])).toBe('')
      expect(normalizePayrollId(true)).toBe('true')
      expect(normalizePayrollId(false)).toBe('false')
    })
  })

  describe('extractValidPayrollIds', () => {
    it('should extract valid payroll IDs from employee array', () => {
      const employees = [
        { payroll_id: 'EMP001', name: 'John' },
        { payroll_id: '  EMP002  ', name: 'Jane' },
        { payroll_id: null, name: 'Bob' },
        { payroll_id: '', name: 'Alice' },
        { payroll_id: 'EMP003', name: 'Charlie' },
      ]

      const result = extractValidPayrollIds(employees)
      expect(result).toEqual(['EMP001', 'EMP002', 'EMP003'])
    })

    it('should handle empty employee array', () => {
      const result = extractValidPayrollIds([])
      expect(result).toEqual([])
    })

    it('should handle employees without payroll_id property', () => {
      const employees = [
        { name: 'John' },
        { payroll_id: 'EMP001', name: 'Jane' },
      ]

      const result = extractValidPayrollIds(employees)
      expect(result).toEqual(['EMP001'])
    })

    it('should handle all invalid payroll IDs', () => {
      const employees = [
        { payroll_id: null, name: 'John' },
        { payroll_id: '', name: 'Jane' },
        { payroll_id: '   ', name: 'Bob' },
      ]

      const result = extractValidPayrollIds(employees)
      expect(result).toEqual([])
    })

    it('should handle numeric payroll IDs', () => {
      const employees = [
        { payroll_id: 123, name: 'John' },
        { payroll_id: 0, name: 'Jane' },
        { payroll_id: 'EMP001', name: 'Bob' },
      ]

      const result = extractValidPayrollIds(employees)
      expect(result).toEqual(['123', '0', 'EMP001'])
    })
  })

  describe('extractNewPayrollIds', () => {
    it('should extract payroll IDs that are different between existing and imported', () => {
      const updatedEmployees = [
        {
          existing: { payroll_id: 'EMP001', name: 'John' },
          imported: { payroll_id: 'EMP001-NEW', name: 'John' }
        },
        {
          existing: { payroll_id: 'EMP002', name: 'Jane' },
          imported: { payroll_id: 'EMP002', name: 'Jane' } // Same ID
        },
        {
          existing: { payroll_id: null, name: 'Bob' },
          imported: { payroll_id: 'EMP003', name: 'Bob' }
        },
        {
          existing: { payroll_id: 'EMP004', name: 'Alice' },
          imported: { payroll_id: null, name: 'Alice' }
        },
      ]

      const result = extractNewPayrollIds(updatedEmployees)
      expect(result).toEqual(['EMP001-NEW', 'EMP003'])
    })

    it('should handle empty updated employees array', () => {
      const result = extractNewPayrollIds([])
      expect(result).toEqual([])
    })

    it('should handle case where all payroll IDs are the same', () => {
      const updatedEmployees = [
        {
          existing: { payroll_id: 'EMP001', name: 'John' },
          imported: { payroll_id: 'EMP001', name: 'John' }
        },
        {
          existing: { payroll_id: 'EMP002', name: 'Jane' },
          imported: { payroll_id: 'EMP002', name: 'Jane' }
        },
      ]

      const result = extractNewPayrollIds(updatedEmployees)
      expect(result).toEqual([])
    })

    it('should handle missing payroll_id properties', () => {
      const updatedEmployees = [
        {
          existing: { name: 'John' },
          imported: { payroll_id: 'EMP001', name: 'John' }
        },
        {
          existing: { payroll_id: 'EMP002', name: 'Jane' },
          imported: { name: 'Jane' }
        },
      ]

      const result = extractNewPayrollIds(updatedEmployees)
      expect(result).toEqual(['EMP001'])
    })

    it('should handle whitespace differences in payroll IDs', () => {
      const updatedEmployees = [
        {
          existing: { payroll_id: 'EMP001', name: 'John' },
          imported: { payroll_id: '  EMP001  ', name: 'John' } // Same after trimming
        },
        {
          existing: { payroll_id: '  EMP002  ', name: 'Jane' },
          imported: { payroll_id: 'EMP002-NEW', name: 'Jane' } // Different after trimming
        },
      ]

      const result = extractNewPayrollIds(updatedEmployees)
      expect(result).toEqual(['EMP002-NEW'])
    })

    it('should handle numeric payroll IDs', () => {
      const updatedEmployees = [
        {
          existing: { payroll_id: 123, name: 'John' },
          imported: { payroll_id: '123', name: 'John' } // Same as string
        },
        {
          existing: { payroll_id: '456', name: 'Jane' },
          imported: { payroll_id: 789, name: 'Jane' } // Different
        },
      ]

      const result = extractNewPayrollIds(updatedEmployees)
      expect(result).toEqual(['789'])
    })
  })
})