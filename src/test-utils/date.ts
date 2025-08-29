import { vi } from 'vitest'

export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString)
  vi.setSystemTime(mockDate)
  return mockDate
}

export const restoreDate = () => {
  vi.useRealTimers()
}

export const createDateRange = (startDate: string, endDate: string) => ({
  start: startDate,
  end: endDate,
})

// Helper to create test dates
export const testDates = {
  jan1_2024: '2024-01-01',
  jan15_2024: '2024-01-15',
  feb1_2024: '2024-02-01',
  jun15_2024: '2024-06-15',
  dec31_2024: '2024-12-31',
  // Monday to Friday in a test week
  monday: '2024-01-01', // This was a Monday
  tuesday: '2024-01-02',
  wednesday: '2024-01-03',
  thursday: '2024-01-04',
  friday: '2024-01-05',
  saturday: '2024-01-06',
  sunday: '2024-01-07',
}