export type CurrencyCode = string;

export type Status = 'loading' | 'ready';

export interface Conversion {
  id: string;
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  result: number;
  date: string; // ISO 8601, e.g. new Date().toISOString()
}

export interface AppState {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  history: Conversion[];
  filter: CurrencyCode | null; // null = no filter
  status: Status;
}
