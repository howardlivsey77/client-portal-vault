import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { WorkDay } from '@/components/employees/details/work-pattern/types'
import { calculateWorkingDaysForRecord } from '@/components/employees/details/sickness/utils/workingDaysCalculations'

interface ValidationPreviewProps {
  records: Array<{
    employeeName: string
    startDate: string
    endDate?: string
    importedDays: number
    employeeId?: string
    workPattern?: WorkDay[]
  }>
}

export const SicknessImportValidationPreview: React.FC<ValidationPreviewProps> = ({ records }) => {
  const validatedRecords = records.map(record => {
    const calculatedDays = record.workPattern 
      ? calculateWorkingDaysForRecord(record.startDate, record.endDate || null, record.workPattern)
      : record.importedDays

    const difference = Math.abs(record.importedDays - calculatedDays)
    const status = difference <= 0.1 ? 'valid' : difference <= 1 ? 'warning' : 'error'

    return {
      ...record,
      calculatedDays,
      difference,
      status
    }
  })

  const totalRecords = validatedRecords.length
  const validRecords = validatedRecords.filter(r => r.status === 'valid').length
  const warningRecords = validatedRecords.filter(r => r.status === 'warning').length
  const errorRecords = validatedRecords.filter(r => r.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Working Days Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{totalRecords}</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validRecords}</div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningRecords}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorRecords}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Records */}
      <Card>
        <CardHeader>
          <CardTitle>Record Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {validatedRecords.map((record, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  record.status === 'valid' ? 'bg-green-50 border-green-200' :
                  record.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {record.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 ${
                        record.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    )}
                    <div>
                      <div className="font-medium">{record.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.startDate} {record.endDate ? `- ${record.endDate}` : '(ongoing)'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={record.status === 'valid' ? 'default' : 'destructive'}>
                        Import: {record.importedDays} days
                      </Badge>
                      <Badge variant="outline">
                        Calculated: {record.calculatedDays} days
                      </Badge>
                    </div>
                    {record.difference > 0.1 && (
                      <div className={`text-sm mt-1 ${
                        record.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        Difference: {record.difference.toFixed(1)} days
                      </div>
                    )}
                  </div>
                </div>
                {record.status !== 'valid' && (
                  <div className={`mt-2 text-sm ${
                    record.status === 'warning' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {record.status === 'warning' 
                      ? 'Minor discrepancy detected - will be auto-corrected'
                      : 'Significant discrepancy detected - working days will be recalculated'
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}