
export type CurrencyCode = "USD" | "EUR" | "GBP" | "SAR" | "AED" | "EGP";
export type statusState = "loading" | "ready";


export interface Conversion {
    id: number;
    from: string;
    to: string;
    amount: string;
    result: string;
    date: string;

}

export interface AppState {
    from: string;
    to: string;
    amount: string;
    history: Conversion[];
    filter: CurrencyCode | null;
    status: statusState;

}