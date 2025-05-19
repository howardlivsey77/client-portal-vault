
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";

export interface SicknessScheme {
  id: string;
  name: string;
  eligibilityRules?: EligibilityRule[] | null;
}
