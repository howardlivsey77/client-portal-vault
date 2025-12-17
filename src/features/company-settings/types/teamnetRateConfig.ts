export interface RateCondition {
  rate: number;
  days: string[];
  time_from: string;
  time_to: string;
}

export interface TeamnetRateConfig {
  id?: string;
  name: string;
  default_rate: number;
  conditions: RateCondition[];
  is_active: boolean;
}
