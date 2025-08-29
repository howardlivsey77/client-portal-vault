import { vi } from 'vitest'

export const createMockSupabaseQuery = (data: any, error: any = null) => ({
  data,
  error,
})

export const mockSupabaseFrom = (tableName: string, mockData: any, mockError: any = null) => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
  }

  // Mock the final promise resolution
  Object.keys(mockQuery).forEach(key => {
    mockQuery[key as keyof typeof mockQuery].mockResolvedValue({
      data: mockData,
      error: mockError,
    })
  })

  return mockQuery
}

export const mockSupabase = {
  from: vi.fn(),
}