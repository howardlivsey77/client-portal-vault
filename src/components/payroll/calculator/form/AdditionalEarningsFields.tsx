
import { DeductionsFields } from "./DeductionsFields";

interface EarningItem {
  description: string;
  amount: number;
}

interface AdditionalEarningsFieldsProps {
  additionalEarnings: EarningItem[];
  onEarningsChange: (earnings: EarningItem[]) => void;
}

export function AdditionalEarningsFields({ 
  additionalEarnings, 
  onEarningsChange 
}: AdditionalEarningsFieldsProps) {
  return (
    <DeductionsFields
      deductions={additionalEarnings}
      onDeductionsChange={onEarningsChange}
      title="Additional Earnings"
    />
  );
}
