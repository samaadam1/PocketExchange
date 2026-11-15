import { showRates, RATES } from './rates.ts';
import { convert, validateAmount } from './state.ts';

const amountInput = document.querySelector<HTMLInputElement>('#amount')!;
const fromSelect = document.querySelector<HTMLSelectElement>('#from')!;
const toSelect = document.querySelector<HTMLSelectElement>('#to')!;
const convertButton = document.querySelector<HTMLButtonElement>('#convert')!;
const message = document.querySelector<HTMLOutputElement>('#message')!;
const result = document.querySelector<HTMLOutputElement>('#result')!;

showRates();   // runs once on page load

convertButton.addEventListener('click', () => {
  // 1. validate first
  const error = validateAmount(amountInput.value);
  if (error !== null) {
    message.style.color = 'red';
    message.textContent = error;
    return;                       // stop here, don't convert
  }

  // 2. valid: clear the old message and convert
  message.textContent = '';
  const amount = Number(amountInput.value);
  const converted = convert(amount, fromSelect.value, toSelect.value, RATES);

  // 3. show "100 EUR = 5,271.74 EGP"
  const formatted = converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  result.textContent = `${amount} ${fromSelect.value} = ${formatted} ${toSelect.value}`;
});
