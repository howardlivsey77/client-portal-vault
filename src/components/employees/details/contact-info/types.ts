
import { Employee } from "@/types";

export interface ContactInfoCardProps {
  employee: Employee;
  formattedAddress: string;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
  isOwnRecord: boolean;
}

export interface ContactInfoFormValues {
  email: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  postcode: string | null;
}

export interface ContactInfoDisplayProps {
  employee: Employee;
  formattedAddress: string;
}

export interface ContactInfoFormProps {
  defaultValues: ContactInfoFormValues;
  onSubmit: (data: ContactInfoFormValues) => Promise<void>;
  onCancel: () => void;
}
