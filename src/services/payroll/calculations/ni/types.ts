
/**
 * NI calculation types
 */

export interface NICBand {
  name: string;
  threshold_from: number;
  threshold_to: number | null;
  rate: number;
  contribution_type: string;
}

export interface NICalculationResult {
  nationalInsurance: number;
  earningsAtLEL: number;
  earningsLELtoPT: number;
  earningsPTtoUEL: number;
  earningsAboveUEL: number;
  earningsAboveST: number;
}
