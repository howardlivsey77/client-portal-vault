
export type ChangeType = 'hire' | 'termination' | 'modification';

export interface EmployeeChange {
  id: string;
  employeeName: string;
  date: string;
  type: ChangeType;
  details: string;
  oldValue?: string;
  newValue?: string;
  field?: string;
}
