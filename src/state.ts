import type { CurrencyCode } from "./types";
import type { AppState, Conversion } from "./types";



const maxHistoryLength = 20;
let IdGenerator = createIdGenerator();
let lastIssuedId = 0;

export function nextId(): number {
    lastIssuedId = IdGenerator();
    return lastIssuedId;
}

export function setLastId(lastId: number): void {
    IdGenerator = createIdGenerator(lastId);
}

export function getLastId(): number {
    return lastIssuedId;

}
export function convert(amount: number, from: CurrencyCode, to: CurrencyCode, rates: Record<CurrencyCode, number>): number {
    const fromRate = rates[from];
    const toRate = rates[to];

    return (amount * toRate) / fromRate;
}

export function AddConversion(state: AppState, result: number): AppState {

    const newConversion: Conversion = {
        id: nextId(),
        from: state.from,
        to: state.to,
        amount: state.amount,
        result: result,
        date: new Date().toISOString(),
    };
    const newHistory = [newConversion, ...state.history].slice(0, maxHistoryLength);
    return { ...state, history: newHistory };
}

export function removeConversion(state: AppState, id: number): AppState {
    const newHistory = state.history.filter((conversion) => conversion.id !== id);
    return { ...state, history: newHistory };
}

export function swapCurrencies(state: AppState): AppState {
    return { ...state, from: state.to, to: state.from };
}

export function getVisibleHistory(state: AppState): Conversion[] {
    if (state.filter) {
        return state.history.filter((conversion) =>
        // return the conversion that has from or to currency that matches the filter
        { return conversion.from === state.filter || conversion.to === state.filter; });
    }

    return state.history;
}

export function getTotals(FilteredHistory: Conversion[]): Record<CurrencyCode, number> {

    // some currencies may be filtered out
    const totals: Partial<Record<CurrencyCode, number>> = {};

    for (const conversion of FilteredHistory) {

        // assign 0 + result if the currency is called for the first time.
        totals[conversion.to] = (totals[conversion.to] ?? 0) + conversion.result;
    }
    return totals as Record<CurrencyCode, number>;
}


export function createIdGenerator(lastId = 0): () => number {
    let current = lastId;

    //Returning a function keeps the scope alive, so each call to the inner function sees the changes the previous one made.
    //return current++ would return a number and nothing else.
    return () => ++current;
}