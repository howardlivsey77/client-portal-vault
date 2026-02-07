import { useAuth } from "@/providers/AuthProvider";
import { useCompany, CompanyRole } from "@/providers/CompanyProvider";

export interface Permissions {
  /** System-wide admin (from profiles.is_admin) */
  isSystemAdmin: boolean;
  /** Company-level role for the current company */
  currentRole: CompanyRole;
  /** Can view employee records */
  canViewEmployees: boolean;
  /** Can edit any employee field (admin only) */
  canEditEmployee: boolean;
  /** Can edit own employee record (contact fields only) */
  canEditOwnRecord: (isOwnRecord: boolean) => boolean;
  /** Can manage sickness records (add/edit/delete) */
  canManageSickness: boolean;
  /** Can manage payroll data */
  canManagePayroll: boolean;
  /** Can delete employee records */
  canDeleteEmployee: boolean;
  /** Can invite users to the company */
  canInviteUsers: boolean;
  /** Can edit HMRC / tax information */
  canEditHmrc: boolean;
  /** Can edit NHS pension information */
  canEditNhsPension: boolean;
  /** Can edit work patterns */
  canEditWorkPattern: boolean;
  /** Can edit salary details */
  canEditSalary: boolean;
}

/**
 * Centralised permissions hook that combines system-wide admin status
 * with company-level role to expose clear capability flags.
 * 
 * Use this instead of passing `isAdmin` props through component trees.
 */
export const usePermissions = (): Permissions => {
  const { isAdmin: isSystemAdmin } = useAuth();
  const { currentRole } = useCompany();

  const isEffectiveAdmin = isSystemAdmin || currentRole === 'admin';
  const isPayroll = currentRole === 'payroll';
  const isBureau = currentRole === 'bureau';

  return {
    isSystemAdmin,
    currentRole,
    canViewEmployees: isEffectiveAdmin || isPayroll || isBureau || currentRole === 'user',
    canEditEmployee: isEffectiveAdmin,
    canEditOwnRecord: (isOwnRecord: boolean) => isEffectiveAdmin || isOwnRecord,
    canManageSickness: isEffectiveAdmin || isPayroll,
    canManagePayroll: isEffectiveAdmin || isPayroll,
    canDeleteEmployee: isEffectiveAdmin,
    canInviteUsers: isEffectiveAdmin,
    canEditHmrc: isEffectiveAdmin,
    canEditNhsPension: isEffectiveAdmin,
    canEditWorkPattern: isEffectiveAdmin,
    canEditSalary: isEffectiveAdmin,
  };
};
