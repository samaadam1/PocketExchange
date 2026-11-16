import createStore from './store.ts';
import { loadRates } from './rates.ts';
import { addConversion, convert, createIdGenerator, swapCurrencies, validateAmount } from './state.ts';
import { loadHistory, saveHistory } from './storage.ts';
import type { AppState, Conversion } from './types.ts';

const amountInput = document.querySelector<HTMLInputElement>('#amount')!;
const fromSelect = document.querySelector<HTMLSelectElement>('#from')!;
const toSelect = document.querySelector<HTMLSelectElement>('#to')!;
const convertButton = document.querySelector<HTMLButtonElement>('#convert')!;
const swapButton = document.querySelector<HTMLButtonElement>('#swap')!;
const message = document.querySelector<HTMLOutputElement>('#message')!;
const result = document.querySelector<HTMLOutputElement>('#result')!;

// This creates the store, and the object passed in, is its initial state, the starting values before the user has done anything.
const store = createStore({
  from: 'EUR',
  to: 'EGP',
  amount: 0,
  history: loadHistory(),   // the saved history, or [] when nothing is saved (or the saved data is broken)
  filter: null,
  status: 'loading',
});

// Gives a new id on each call (1, 2, 3, ...) and keeps counting after a refresh. Created once, here.
const nextId = createIdGenerator();

// The loaded rates. Not part of the state: filled once, when loadRates() finishes.
const rates: Record<string, number> = {};

////////////////////// RENDERING //////////////////////////
// Fills a dropdown with one <option> per currency code (skips the work if it already has them).
function fillOptions(select: HTMLSelectElement, codes: string[]): void {
  const current = Array.from(select.options, (option) => option.value);

  // It checks whether the two lists of currency codes are the same.
  // .join() turns an array into one string, with a comma between items. ['USD', 'EUR'] becomes "USD,EUR"
  // - current is the list of codes already in the dropdown, for example ['USD', 'EUR', 'GBP'].
  // - codes is the list of codes the dropdown should have.
  if (current.join() === codes.join()) return;

  /*
  Option is a built-in browser constructor that creates an <option> element. new calls it to make a fresh one. It takes the text and the value as its first two arguments:
  new Option(text, value)

  For example:
  new Option('Euro', 'EUR')
  creates the same thing as this HTML:
  <option value="EUR">Euro</option>
  */
  select.replaceChildren(...codes.map((code) => new Option(code, code)));
}

// "100 EUR = 5,271.74 EGP"
function covertionResult(item: Conversion): string {
  const formatted = item.result.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${item.amount} ${item.from} = ${formatted} ${item.to}`;
}

// Draws the page from the state. It runs every time the state changes.
// The screen only changes through setState: rendering runs as a subscriber.
function render(state: AppState): void {
  convertButton.disabled = state.status === 'loading';

  if (state.status === 'loading') {
    message.style.color = 'blue';
    message.textContent = 'Loading rates…';
  } else {
    message.textContent = '';

    // Object.keys(rates) returns an array of an object's property names:
    // { USD: 1, EUR: 0.92, ... } -> ['USD', 'EUR', ...]
    const codes = Object.keys(rates);
    fillOptions(fromSelect, codes);
    fillOptions(toSelect, codes);
    fromSelect.value = state.from;
    toSelect.value = state.to;
  }

  // the result is the latest conversion in the history
  /*  So latest is either:
  - a Conversion object (a conversion exists), or
  - undefined (the history is empty, so there's no item 0). 
  */
  const latest: Conversion | undefined = state.history[0];
  // it is only shown while it matches the selected currencies: after a swap or a currency change it is cleared
  result.textContent =
    latest !== undefined && latest.from === state.from && latest.to === state.to
      ? covertionResult(latest)
      : `0.00 ${state.to}`;
}

//////////////////////////// EVENT LISTENERS ///////////////////////////

fromSelect.addEventListener('change', () => {
  store.setState((state) => ({ ...state, from: fromSelect.value }));
});

toSelect.addEventListener('change', () => {
  store.setState((state) => ({ ...state, to: toSelect.value }));
});

// Converts the amount with the selected currencies and adds it to the history (render shows the new result).
function addNewConversion(newAmount: number): void {
  store.setState((state) => {
    // Create a new conversion object.
    const newConversion: Conversion = {
      id: String(nextId()), // the next number as text, because Conversion.id is a string
      from: state.from,
      to: state.to,
      amount: newAmount,
      result: convert(newAmount, state.from, state.to, rates),
      date: new Date().toISOString(),
    };
    // return new state: the conversion is added to the history, and the amount is updated.
    return { ...addConversion(state, newConversion), amount: newAmount };
  });
}

// The Swap button is clicked: From and To trade places (render updates both dropdowns),
// then the amount is converted again the other way round.
swapButton.addEventListener('click', () => {
  store.setState((state) => swapCurrencies(state));

  // clear the old result (done after setState, because render writes the result line)
  result.textContent = '';

  // with a valid amount, convert it again and show the new result (no error message otherwise)
  if (validateAmount(amountInput.value) === null) {
    addNewConversion(Number(amountInput.value));
  }
});

// The Convert button is clicked: validate the amount, then convert and add it to the history.
convertButton.addEventListener('click', () => {
  // clear the old result on every click (render shows the new one after a valid conversion)
  result.textContent = '';

  // 1. validate first
  const error = validateAmount(amountInput.value);
  if (error !== null) {
    // error messages are not saved in the state: they are written straight to the page
    message.style.color = 'red';
    message.textContent = error;
    return;                       // stop here, don't convert
  }

  // 2. valid: convert and add it to the history (render clears the message and shows it)
  addNewConversion(Number(amountInput.value));
});

////////////////////////// // STARTUP //////////////////////////

// load the rates, then mark the state ready: render fills the dropdowns and enables Convert
async function start(): Promise<void> {
  Object.assign(rates, await loadRates());
  store.setState((state) => ({ ...state, status: 'ready' }));
}


// That line means "whenever the state changes, call render with the new state."
// Later, every time setState accepts a new state, it goes through the list and runs each function:
// subscribers.forEach((subscriber) => subscriber(state));
store.subscribe(render);
store.subscribe((state) => saveHistory(state.history));   // save the history on every state change
render(store.getState());   // draw the starting state once

start();
