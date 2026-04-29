export interface Shift {
  id: number;
  day: string;
  slot: string;
  zone: string;
  hours: number;
  gross_earnings: number;
  tip_total: number;
  miles_driven: number;
  order_count: number;
  gas_cost: number;
  net_earnings: number;
  weather_condition: string;
  local_event: string | null;
  notes: string | null;
  created_at: string;
  hourly_rate: number;
  tip_rate: number;
}
