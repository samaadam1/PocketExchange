import type { CurrencyCode } from "./types.ts";
export const RATES: Record<CurrencyCode, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    SAR: 3.75,
    AED: 3.67,
    EGP: 48.5,
};

export function LoadRates(): Record<CurrencyCode, number> {
    return RATES;
}