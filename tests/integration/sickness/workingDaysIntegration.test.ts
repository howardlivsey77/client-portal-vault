import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  countWorkingDaysBetween, 
  calculateWorkingDaysForRecord 
} from '@/components/employees/details/sickness/utils/workingDaysCalculations'
import { WorkDay } from "@/components/employees/details/work-pattern/types"

// Integration test scenarios that mirror real-world usage
describe('Working Days Calculations - Integration Tests', () => {
  const fullTimePattern: WorkDay[] = [
    { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
    { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
    { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
    { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
    { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
    { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP001' },
    { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP001' },
  ]

  describe('Import to Entitlement Workflow', () => {
    it('should handle complete import-to-entitlement calculation workflow', () => {
      // Simulate sickness import data
      const sicknessImports = [
        {
          employeeId: 'emp1',
          startDate: '2025-09-22', // Monday
          endDate: '2025-09-26',   // Friday
          importedDays: 5, // From CSV
          workPattern: fullTimePattern
        },
        {
          employeeId: 'emp2', 
          startDate: '2025-09-22', // Monday
          endDate: '2025-09-23',   // Tuesday
          importedDays: 2, // From CSV
          workPattern: fullTimePattern
        }
      ]

      // Process each import record
      const processedRecords = sicknessImports.map(record => {
        const calculatedDays = countWorkingDaysBetween(
          record.startDate,
          record.endDate,
          record.workPattern
        )

        return {
          ...record,
          calculatedDays,
          shouldCorrect: Math.abs(record.importedDays - calculatedDays) > 0.1,
          finalDays: Math.abs(record.importedDays - calculatedDays) > 1 
            ? calculatedDays 
            : record.importedDays
        }
      })

      // Verify calculations
      expect(processedRecords[0].calculatedDays).toBe(5)
      expect(processedRecords[0].shouldCorrect).toBe(false)
      expect(processedRecords[0].finalDays).toBe(5)

      expect(processedRecords[1].calculatedDays).toBe(2)
      expect(processedRecords[1].shouldCorrect).toBe(false)
      expect(processedRecords[1].finalDays).toBe(2)
    })

    it('should detect and correct discrepancies during import', () => {
      const problematicImports = [
        {
          employeeId: 'emp3',
          startDate: '2025-09-22', // Monday
          endDate: '2025-09-26',   // Friday  
          importedDays: 3, // Incorrect - should be 5
          workPattern: fullTimePattern
        }
      ]

      const processedRecord = problematicImports.map(record => {
        const calculatedDays = countWorkingDaysBetween(
          record.startDate,
          record.endDate,
          record.workPattern
        )

        const difference = Math.abs(record.importedDays - calculatedDays)

        return {
          ...record,
          calculatedDays,
          difference,
          correctionNeeded: difference > 1,
          finalDays: difference > 1 ? calculatedDays : record.importedDays,
          auditFlag: difference > 0.1
        }
      })[0]

      expect(processedRecord.calculatedDays).toBe(5)
      expect(processedRecord.difference).toBe(2)
      expect(processedRecord.correctionNeeded).toBe(true)
      expect(processedRecord.finalDays).toBe(5) // Auto-corrected
      expect(processedRecord.auditFlag).toBe(true) // Should be logged
    })
  })

  describe('Real-time UI Validation', () => {
    it('should validate sickness form input in real-time', () => {
      // Simulate user form input
      const formData = {
        startDate: '2025-09-22',
        endDate: '2025-09-24', // Mon-Wed
        manualDays: 2 // User might enter wrong value
      }

      const calculatedDays = countWorkingDaysBetween(
        formData.startDate,
        formData.endDate,
        fullTimePattern
      )

      const validation = {
        calculatedDays,
        userInputDays: formData.manualDays,
        isValid: Math.abs(calculatedDays - formData.manualDays) <= 0.1,
        suggestion: calculatedDays,
        warningMessage: Math.abs(calculatedDays - formData.manualDays) > 0.1 
          ? `Expected ${calculatedDays} working days for this period`
          : null
      }

      expect(validation.calculatedDays).toBe(3) // Mon, Tue, Wed
      expect(validation.isValid).toBe(false) // User entered 2, should be 3
      expect(validation.warningMessage).toBe('Expected 3 working days for this period')
    })
  })

  describe('Database Trigger Simulation', () => {
    it('should simulate database trigger behavior', () => {
      // Simulate what the database trigger would do
      const mockDatabaseInsert = (record: any) => {
        const calculatedDays = countWorkingDaysBetween(
          record.start_date,
          record.end_date,
          fullTimePattern
        )

        const tolerance = 0.1
        const difference = Math.abs(record.total_days - calculatedDays)

        let auditLog = null
        let finalRecord = { ...record }

        // Log discrepancy (like the trigger does)
        if (difference > tolerance) {
          auditLog = {
            record_id: record.id,
            stored_total_days: record.total_days,
            calculated_total_days: calculatedDays,
            difference: record.total_days - calculatedDays,
            audit_type: 'working_days_mismatch'
          }
        }

        // Auto-correct significant differences (like the trigger does)
        if (difference > 1) {
          finalRecord.total_days = calculatedDays
        }

        return { finalRecord, auditLog }
      }

      const testRecord = {
        id: 'record1',
        employee_id: 'emp1',
        start_date: '2025-09-22',
        end_date: '2025-09-26',
        total_days: 3 // Wrong value
      }

      const result = mockDatabaseInsert(testRecord)

      expect(result.finalRecord.total_days).toBe(5) // Auto-corrected
      expect(result.auditLog).not.toBeNull()
      expect(result.auditLog?.difference).toBe(-2) // 3 - 5 = -2
    })
  })

  describe('Cross-validation Between Systems', () => {
    it('should ensure frontend and backend calculations match', () => {
      const testCases = [
        { start: '2025-09-22', end: '2025-09-22', expected: 1 }, // Single day
        { start: '2025-09-22', end: '2025-09-26', expected: 5 }, // Full week
        { start: '2025-09-27', end: '2025-09-28', expected: 0 }, // Weekend only
        { start: '2025-09-22', end: '2025-09-28', expected: 5 }, // Week including weekend
      ]

      testCases.forEach(testCase => {
        const frontendResult = countWorkingDaysBetween(
          testCase.start,
          testCase.end,
          fullTimePattern
        )

        // This would be the result from our database function
        // (simulated here since we can't call actual DB function in unit tests)
        const backendResult = testCase.expected

        expect(frontendResult).toBe(backendResult)
      })
    })
  })

  describe('Ongoing Absence Handling', () => {
    it('should handle ongoing absences correctly', () => {
      // Test ongoing absence (no end date)
      const ongoingMonday = calculateWorkingDaysForRecord(
        '2025-09-22', // Monday
        null,
        fullTimePattern
      )

      const ongoingSaturday = calculateWorkingDaysForRecord(
        '2025-09-27', // Saturday
        null,
        fullTimePattern
      )

      expect(ongoingMonday).toBe(1) // Monday is working day
      expect(ongoingSaturday).toBe(0) // Saturday is not working day
    })
  })
})