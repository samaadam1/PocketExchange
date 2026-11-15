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

export async function showRates(): Promise<void> {
  const fromSelect = document.querySelector<HTMLSelectElement>('#from')!;
  const toSelect = document.querySelector<HTMLSelectElement>('#to')!;
  const convertButton = document.querySelector<HTMLButtonElement>('#convert')!;
  const message = document.querySelector<HTMLOutputElement>('#message')!;

  message.style.color = 'blue'
  message.textContent = 'Loading rates…';
  convertButton.disabled = true;

  const rates = await loadRates();

  //   Object.keys(rates) returns an array of an object's property names. rates object looks like this:
  //{ USD: 1, EUR: 0.92, GBP: 0.79, SAR: 3.75, AED: 3.67, EGP: 48.5 }
  const codes = Object.keys(rates);

  /*
  Option is a built-in browser constructor that creates an <option> element. new calls it to make a fresh one. It takes the text and the value as its first two arguments:
  new Option(text, value)

  For example:
  new Option('Euro', 'EUR')
  creates the same thing as this HTML:
  <option value="EUR">Euro</option>
  */
  fromSelect.replaceChildren(...codes.map((code) => new Option(code, code)));
  toSelect.replaceChildren(...codes.map((code) => new Option(code, code)));

  message.textContent = '';
  convertButton.disabled = false;
}