import type { CurrencyCode } from "./types";

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode, rates: Record<CurrencyCode, number>): number {
    const fromRate = rates[from];
    const toRate = rates[to];

    return (amount * toRate) / fromRate;
}

export function createIdGenerator(): void {
}

export function update(): void { }