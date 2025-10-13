/**
 * Employee self-service permissions
 * Defines which fields employees can edit on their own records
 */

export const EMPLOYEE_EDITABLE_FIELDS = [
  'email',
  'address1',
  'address2',
  'address3',
  'address4',
  'postcode'
] as const;

export type EmployeeEditableField = typeof EMPLOYEE_EDITABLE_FIELDS[number];

/**
 * Check if a user can edit a specific employee field
 * @param fieldName - The field to check
 * @param isAdmin - Whether the user is an admin
 * @param isOwnRecord - Whether the user is viewing their own employee record
 * @returns boolean indicating if the field can be edited
 */
export const canEmployeeEditField = (
  fieldName: string,
  isAdmin: boolean,
  isOwnRecord: boolean
): boolean => {
  // Admins can edit any field
  if (isAdmin) return true;
  
  // Employees can only edit their contact info on their own record
  if (isOwnRecord) {
    return EMPLOYEE_EDITABLE_FIELDS.includes(fieldName as EmployeeEditableField);
  }
  
  return false;
};
