import { WorkDay } from "@/components/employees/details/work-pattern/types"

export const mockWorkPatternFullTime: WorkDay[] = [
  { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP001' },
  { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP001' },
  { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP001' },
]

export const mockWorkPatternPartTime: WorkDay[] = [
  { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '13:00', payrollId: 'EMP002' },
  { day: 'Tuesday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
  { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '13:00', payrollId: 'EMP002' },
  { day: 'Thursday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
  { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '13:00', payrollId: 'EMP002' },
  { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
  { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP002' },
]

export const mockWorkPattern4Day: WorkDay[] = [
  { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP003' },
  { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP003' },
  { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP003' },
  { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00', payrollId: 'EMP003' },
  { day: 'Friday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP003' },
  { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP003' },
  { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: 'EMP003' },
]