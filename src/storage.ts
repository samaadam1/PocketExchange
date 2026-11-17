import type { Conversion } from './types.ts';

const HISTORY_KEY = 'pocket-exchange:history';

// Saves the history in localStorage as text (JSON).
export function saveHistory(history: Conversion[]): void {
    try {
        // json.stringify converts a JavaScript value to a JSON string. It can throw an exception if the value cannot be converted, so it is wrapped in try/catch.
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
        // localStorage is full or blocked: the app still works, the history is just not kept
    }
}

// Checks that a value read from localStorage really has the shape of a Conversion.
// The function returns true or false
// If isConversion returns true, the value is treated as a Conversion.
function isConversion(value: unknown): value is Conversion {
    if (typeof value !== 'object' || value === null) return false;

    // value as Record<string, unknown> means "treat value as an object with string keys and unknown values". 
    const item = value as Record<string, unknown>;
    return (
        // typeof: checks the type of a value. It returns a string indicating the type, such as 'string', 'number', 'object', etc.
        typeof item['id'] === 'string' &&
        typeof item['from'] === 'string' &&
        typeof item['to'] === 'string' &&
        typeof item['amount'] === 'number' &&
        typeof item['result'] === 'number' &&
        typeof item['date'] === 'string'
    );
}

// Reads the history back. Returns an empty list when nothing is saved, or when the saved data is
// broken. Entries that don't look like a Conversion are skipped.
export function loadHistory(): Conversion[] {
    try {
        const savedJSON = localStorage.getItem(HISTORY_KEY);
        if (savedJSON === null) return []; // nothing saved yet

        // parses the text into a JavaScript value. JSON.parse can throw an exception if the text is not valid JSON, so it is wrapped in try/catch.
        const dataJavaScript: unknown = JSON.parse(savedJSON); // JSON.parse("abc") throws an error
        // Check if the parsed data is an array.
        if (!Array.isArray(dataJavaScript)) return []; // from here on, TypeScript thinks dataJavaScript is any[]

        const items: unknown[] = dataJavaScript;
        // Filter the items to only include those that are valid Conversions.
        return items.filter(isConversion);
    } catch {
        return [];   // the saved text is not valid JSON, or localStorage is blocked
    }
}
