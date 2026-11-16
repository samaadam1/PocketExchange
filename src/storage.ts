import type { Conversion } from './types.ts';

const HISTORY_KEY = 'pocket-exchange:history';

// Checks that a value read from localStorage really has the shape of a Conversion.
function isConversion(value: unknown): value is Conversion {
    if (typeof value !== 'object' || value === null) return false;

    // value as Record<string, unknown> means "treat value as an object with string keys and unknown values". 
    // This is a type assertion that tells TypeScript to treat value as a Record<string, unknown> for the purpose of this check. 
    // It allows us to access properties like item['id'] without TypeScript complaining that value might not have those properties.
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

// Saves the history in localStorage as text (JSON).
export function saveHistory(history: Conversion[]): void {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
        // localStorage is full or blocked: the app still works, the history is just not kept
    }
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
        if (!Array.isArray(dataJavaScript)) return [];

        const items: unknown[] = dataJavaScript;
        // Filter the items to only include those that are valid Conversions.
        return items.filter(isConversion);
    } catch {
        return [];   // the saved text is not valid JSON, or localStorage is blocked
    }
}
