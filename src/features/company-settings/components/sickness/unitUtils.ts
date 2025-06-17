
export type TimeUnit = 'days' | 'weeks' | 'months' | 'years';

export const TIME_UNIT_OPTIONS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' }
] as const;

export const PAY_UNIT_OPTIONS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' }
] as const;

// Convert time units to days for comparison purposes
export const convertToDays = (value: number, unit: TimeUnit): number => {
  switch (unit) {
    case 'days':
      return value;
    case 'weeks':
      return value * 7;
    case 'months':
      return value * 30; // Approximate for comparison only
    case 'years':
      return value * 365; // Approximate for comparison only
    default:
      return value;
  }
};

// Enhanced conversion that considers work pattern for months (for actual entitlement calculations)
export const convertToAccurateDays = (
  value: number, 
  unit: TimeUnit | 'days' | 'weeks' | 'months',
  workingDaysPerWeek: number = 5
): number => {
  switch (unit) {
    case 'days':
      return value;
    case 'weeks':
      return value * workingDaysPerWeek;
    case 'months':
      // Use accurate formula: workingDaysPerWeek × 52.14 ÷ 12 × months (rounded down)
      return Math.floor((workingDaysPerWeek * 52.14 / 12) * value);
    case 'years':
      return Math.floor(workingDaysPerWeek * 52.14 * value);
    default:
      return value;
  }
};

// Format display text for units
export const formatUnitDisplay = (value: number, unit: TimeUnit | 'days' | 'weeks' | 'months'): string => {
  const unitText = value === 1 ? unit.slice(0, -1) : unit;
  return `${value} ${unitText}`;
};
