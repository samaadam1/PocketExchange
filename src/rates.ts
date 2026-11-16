export const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  EGP: 48.5,
};

export async function loadRates(): Promise<Record<string, number>> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return RATES;
}
