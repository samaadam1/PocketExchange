import createStore from './store.ts';
import { loadRates } from './rates.ts';
import {
  addConversion,
  clearHistory,
  convert,
  createIdGenerator,
  getTotals,
  getFilteredHistory,
  removeConversion,
  swapCurrencies,
  validateAmount,
} from './state.ts';
import { loadHistory, saveHistory } from './storage.ts';
import type { AppState, Conversion } from './types.ts';

// Helper function to get an element by its ID and assert its type. It throws an error if the element is not found.
function getElement<T extends HTMLElement>(id: string): T {

  // ex: amountInput = document.querySelector<HTMLInputElement>('#amount')!;
  const element = document.querySelector<T>(id);
  if (element === null) throw new Error(`${id} was not found on the page`);
  return element;
}

const amountInput = getElement<HTMLInputElement>('#amount');
const fromSelect = getElement<HTMLSelectElement>('#from');
const toSelect = getElement<HTMLSelectElement>('#to');
const convertButton = getElement<HTMLButtonElement>('#convert');
const swapButton = getElement<HTMLButtonElement>('#swap');
const message = getElement<HTMLOutputElement>('#message');
const ConversionResult = getElement<HTMLOutputElement>('#result');
const filterSelect = getElement<HTMLSelectElement>('#filter_history');
const historyList = getElement<HTMLUListElement>('#history_list');
const totalOutput = getElement<HTMLOutputElement>('#total_conversions');
const clearButton = getElement<HTMLButtonElement>('#clear_history');

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
function fillOptions(select: HTMLSelectElement, CurrencyCodes: string[]): void {
  const current = Array.from(select.options, (option) => option.value);

  // It checks whether the two lists of currency codes are the same.
  // .join() turns an array into one string, with a comma between items. ['USD', 'EUR'] becomes "USD,EUR"
  // - current is the list of codes already in the dropdown, for example ['USD', 'EUR', 'GBP'].
  // - codes is the list of codes the dropdown should have.
  if (current.join() === CurrencyCodes.join()) return;

  /*
  Option is a built-in browser constructor that creates an <option> element. new calls it to make a fresh one. It takes the text and the value as its first two arguments:
  new Option(text, value)

  For example:
  new Option('Euro', 'EUR')
  creates the same thing as this HTML:
  <option value="EUR">Euro</option>
  */
  select.replaceChildren(...CurrencyCodes.map((code) => new Option(code, code)));
}

// 5271.7391 -> "5,271.74"
function formatMoney(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


// "100 EUR = 5,271.74 EGP". The history list passes '->' to get "100 EUR -> 5,271.74 EGP".
function conversionResult(item: Conversion, symbol: string = '='): string {
  return `${item.amount} ${item.from} ${symbol} ${formatMoney(item.result)} ${item.to}`;
}

// One <li> of the history list: the conversion text and a delete button.
function renderList(item: Conversion): HTMLLIElement {
  const li = document.createElement('li');

  const text = document.createElement('span');
  text.textContent = conversionResult(item, '->');

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'delete';
  removeButton.dataset['id'] = item.id;   // tells the list listener which conversion to delete
  removeButton.setAttribute('aria-label', 'Delete this conversion');
  removeButton.textContent = 'x';

  li.append(text, removeButton);
  return li;
}

// "7,696.74 EGP | 25.32 USD": the total converted into each currency, for the entries shown.
function totalsResult(state: AppState): string {

  // get totals of filtered history.
  const totalsFiltered = getTotals({ ...state, history: getFilteredHistory(state) });

  const parts = Object.keys(totalsFiltered) // returnobject's property names as array.
    .sort()   // alphabetical, so the order doesn't change from one conversion to the next
    .map((code) => `${formatMoney(totalsFiltered[code])} ${code}`); // totalsFiltered[code] is the total for that currency, then formate it to string
  return parts.length === 0 ? '0.00' : parts.join(' | '); // glues the pieces into one string, putting | between them:
}


// Draws the conversion part of the page: the Convert button, the message, the two dropdowns and the result line.
function renderConversion(state: AppState): void {

  // if status is still loading (true) then convert button is disabled.
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
  const latestConversion: Conversion | undefined = state.history[0];
  // it is only shown while it matches the selected currencies: after a swap or a currency change it is cleared
  ConversionResult.textContent =
    latestConversion !== undefined && latestConversion.from === state.from && latestConversion.to === state.to
      ? conversionResult(latestConversion)
      : `0.00 ${state.to}`;
}

// Draws the page from the state. It runs every time the state changes.
// The screen only changes through setState: rendering runs as a subscriber.
function render(state: AppState): void {

  // Render the conversion part of the page: the Convert button, the message, the two dropdowns and the result line.
  renderConversion(state);

  // Render the history list.
  const filteredHistory = getFilteredHistory(state);
  // maps the filtered history to <li> elements and replaces the old list with the new one. It clears the old list and adds the new items.
  historyList.replaceChildren(...filteredHistory.map(renderList));

  // Render the totals line and the filter dropdown.
  totalOutput.textContent = totalsResult(state);
  filterSelect.value = state.filter ?? '';
  clearButton.disabled = state.history.length === 0;
}

//////////////////////////// EVENT LISTENERS ///////////////////////////

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
    // addConversion is the small helper that puts a conversion into the history.
    return { ...addConversion(state, newConversion), amount: newAmount };
  });
}


fromSelect.addEventListener('change', () => {
  store.setState((state) => ({ ...state, from: fromSelect.value }));
});

toSelect.addEventListener('change', () => {
  store.setState((state) => ({ ...state, to: toSelect.value }));
});



// The Swap button is clicked: From and To trade places (render updates both dropdowns),
// then the amount is converted again the other way round.
swapButton.addEventListener('click', () => {
  store.setState((state) => swapCurrencies(state));

  // clear the old result (done after setState, because render writes the result line)
  ConversionResult.textContent = '';

  // with a valid amount, convert it again and show the new result (no error message otherwise)
  if (validateAmount(amountInput.value) === null) {
    addNewConversion(Number(amountInput.value));
  }
});

// The Convert button is clicked: validate the amount, then convert and add it to the history.
convertButton.addEventListener('click', () => {
  // clear the old result on every click (render shows the new one after a valid conversion)
  ConversionResult.textContent = '';

  // 1. validate first
  const error = validateAmount(amountInput.value);
  if (error !== null) {
    // error messages are not saved in the state: they are written straight to the page
    message.style.color = 'red';
    message.textContent = error;
    return; // stop here, don't convert
  }

  // 2. valid: convert and add it to the history (render clears the message and shows it)
  addNewConversion(Number(amountInput.value));
});

// The filter dropdown changed: '' means "All" (no filter).
filterSelect.addEventListener('change', () => {
  const value = filterSelect.value;
  store.setState((state) => ({ ...state, filter: value === '' ? null : value }));
});

// Clear All is clicked: the history becomes empty.
clearButton.addEventListener('click', () => {
  store.setState((state) => clearHistory(state));
});

// One listener for the whole list (not one per item): it finds out which delete button was clicked.
historyList.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  // .closest(...) starts at the clicked element and looks upward through its parents for the first one that matches button.delete, 
  // a <button> with the class delete. It returns that button, or null if there isn't one.
  const button = target.closest<HTMLButtonElement>('button.delete');

  // If the click was not on a delete button, do nothing. If it was, get the id of the conversion to remove from the button's data-id attribute.
  const id = button?.dataset['id'];
  if (id === undefined) return;

  store.setState((state) => removeConversion(state, id));
});

////////////////////////// // STARTUP //////////////////////////

// load the rates, then mark the state ready: render fills the dropdowns and enables Convert
async function start(): Promise<void> {
  // Object.assign(rates, ...) copies every property of the loaded rates into the existing rates object near the top of main.ts.
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
