import type { AppState, Conversion, CurrencyCode } from './types.ts';

const MAX_HISTORY = 20;

// The function must return a number.
export function convert(amount: number, from: string, to: string, rates: Record<string, number>): number {
    if (from === to) return amount;
    return (amount / rates[from]) * rates[to];
}

// Returns an error message, or null when the amount is valid.
export function validateAmount(raw: string): string | null {

    // remove white space from the beginning and end of the string
    const text = raw.trim();
    if (text === '') return 'Enter an amount';

    const amount = Number(text);
    if (!Number.isFinite(amount)) return 'Amount must be a number';
    if (amount === 0) return 'Amount cannot be zero';
    if (amount < 0) return 'Amount cannot be negative';

    return null;
}

// Returns a new state with the conversion at the top of the history. Only the latest 20 are kept.
// .slice(start, end) returns a copy of part of an array. It takes the items from position start up to, but not including, position end. 
// The original array is not changed.
export function addConversion(state: AppState, conversion: Conversion): AppState {
    const newState = { ...state, history: [conversion, ...state.history].slice(0, MAX_HISTORY) };

    // Prove it: after adding a conversion, check whether the new state, the new history array and the old items are the same objects as before, and explain each result.
    console.log(`History size: ${state.history.length} -> ${newState.history.length}`);

    // Same object (===) or not? A new object means the old one was not changed.
    console.log('Same state object?', newState === state,
        '(false: a new state was created, so the store sees a change)');
    console.log('Same history array?', newState.history === state.history,
        '(false: a new array was created, the old array is untouched)');

    // The old items that are still in the new history (the oldest one is dropped when it is over 20).
    // .slice(1) means "everything from position 1 onward"
    const keptItems = newState.history.slice(1);
    const sameItems = keptItems.every((item, index) => item === state.history[index]);
    console.log('Same old items?', sameItems,
        '(true: the items are reused, not copied. Only the arrays are new)');

    return newState;
}

// Returns a new state without the conversion that has this id. The state it receives is not changed.
export function removeConversion(state: AppState, id: string): AppState {
    return { ...state, history: state.history.filter((item) => item.id !== id) };
}

// Returns a new state with the From and To currencies swapped. The state it receives is not changed.
export function swapCurrencies(state: AppState): AppState {
    return { ...state, from: state.to, to: state.from };
}

// Returns the history for the selected filter, or the whole history when there is no filter.
// A conversion matches when the filter currency is its From or its To. The state it receives is not changed.
export function getVisibleHistory(state: AppState): Conversion[] {
    const { history, filter } = state;
    if (filter === null) return history; // no filter, return the whole history
    return history.filter((item) => item.from === filter || item.to === filter); // only return the conversions that match the filter
}

// Returns an object with the total converted into each currency: { EGP: 5271.74, USD: 108.7 }.
// It adds up the result of every conversion in the history, grouped by its To currency.
// The state it receives is not changed.
export function getTotals(state: AppState): Record<CurrencyCode, number> {
    const totals: Record<CurrencyCode, number> = {};
    for (const item of state.history) {
        // item.to : example "EGP"
        // item.result : example 48.5
        // totals[item.to] ?? 0 means "if totals[item.to] is undefined, use 0 instead"
        //totals[item.to] : That currency's page in the notebook: the total so far for EGP.
        totals[item.to] = (totals[item.to] ?? 0) + item.result;
    }
    return totals;
}

// Returns a new state with an empty history. The state it receives is not changed.
export function clearHistory(state: AppState): AppState {
    return { ...state, history: [] };
}


/*

localStorage is a small storage area that your browser keeps on your computer, separately for each website address. It isn't a file in your project, and it isn't on a server. The data belongs to the browser (Chrome, Edge, and so on) and to the address, 
such as http://localhost:5173. Another address gets its own empty storage, and so does another browser.

- It survives refreshes and closing the browser. It's only removed if you clear it or clear the browser's site data.
- Values are text. A number you save comes back as a string, which is why the code uses String(lastId) going in and Number(...) coming out.
- It's private to the browser. It isn't shared between devices, and it's not secure, because anyone using the browser can read it. Don't store passwords in it.
- It can be blocked in private/incognito mode in some browsers, which is why the code wraps it in try/catch.
*/

const LAST_ID_KEY = 'pocket-exchange:last-id';

// The last id that was handed out, read from localStorage. 0 when there is none (or it is not a valid number).
function loadLastId(): number {
    try {
        // getItem returns null when there is no value for that key, so Number(null) gives 0.
        const saved = Number(localStorage.getItem(LAST_ID_KEY));
        return Number.isInteger(saved) && saved > 0 ? saved : 0;
    } catch {
        return 0;   // localStorage is blocked: start from 0
    }
}

// Returns a function that gives a new number on each call: 1, 2, 3, ...
// The last number is saved in localStorage, so after a refresh the counting continues
// where it stopped (it never starts again from 1).
export function createIdGenerator(): () => number {
    // let is needed because the counter goes up by one on every call
    let lastId = loadLastId();

    return () => {
        lastId += 1;
        try {
            // setItem can throw an exception when localStorage is full or blocked, so it is wrapped in try/catch.
            localStorage.setItem(LAST_ID_KEY, String(lastId));
        } catch {
            // localStorage is full or blocked: it still counts correctly until the page is refreshed
        }
        return lastId;
    };
}

