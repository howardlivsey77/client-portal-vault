
export interface WorkDay {
  day: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
  payrollId?: string | null;
}

export interface WorkPatternCardProps {
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    payroll_id?: string | null;
    [key: string]: any;
  };
  isAdmin: boolean;
  refetchEmployeeData?: () => Promise<void>;
}
