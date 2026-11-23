
export type CurrencyCode = "USD" | "EUR" | "GBP" | "SAR" | "AED" | "EGP";
export type statusState = "loading" | "ready";


export interface Conversion {
    id: number;
    from: CurrencyCode;
    to: CurrencyCode;
    amount: number;
    result: number;
    date: string;

}

export interface AppState {
    from: CurrencyCode;
    to: CurrencyCode;
    amount: number;
    history: Conversion[];
    filter: CurrencyCode | null;
    status: statusState;

}