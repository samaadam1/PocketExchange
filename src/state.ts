
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
