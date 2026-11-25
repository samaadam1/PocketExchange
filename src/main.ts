import { loadRates } from "./rates";
import { AddConversion, convert, getTotals, getVisibleHistory, removeConversion, setLastId, swapCurrencies } from "./state";
import type { AppState, CurrencyCode, Conversion } from "./types";
import createStore from "./store";
import { loadHistory, saveHistory, saveLastId, loadLastId } from "./storage";

let rates: Record<CurrencyCode, number>; // rates are assigned later, in start()

const initialState: AppState = {
  from: "EGP",
  to: "USD",
  amount: 0,
  history: [],
  filter: null,
  status: "loading",
};

const store = createStore(initialState);
const loadedHistory = loadHistory();

const fromSelect = document.querySelector<HTMLSelectElement>("#from");
const toSelect = document.querySelector<HTMLSelectElement>("#to");
const swapButton = document.querySelector<HTMLButtonElement>("#swap");
const amountInput = document.querySelector<HTMLInputElement>("#amount");
const convertButton = document.querySelector<HTMLButtonElement>("#convert");
const convertResult = document.querySelector<HTMLOutputElement>("#result");
const convertMessage = document.querySelector<HTMLOutputElement>("#message");
const historyFilter = document.querySelector<HTMLSelectElement>("#filter_history");
const historyList = document.querySelector<HTMLUListElement>("#history_list");
const historyItemTemplate = document.querySelector<HTMLTemplateElement>("#history_item");
const totalConv = document.querySelector<HTMLOutputElement>("#total_conversions");
const clearHistoryButton = document.querySelector<HTMLButtonElement>("#clear_history");


async function main(): Promise<void> {

  store.subscribe(render);
  store.subscribe(saveHistory);
  store.subscribe(saveLastId);

  if (loadedHistory) {
    store.setState((old) => ({ ...old, history: loadedHistory.history }));
    const lastId = loadLastId();
    setLastId(lastId);
  }

  render(store.getState());

  await start();

  // eventListeners() doesn't keep checking. It runs once, and it registers handlers with the browser. 
  // The browser does the watching afterward.
  eventListeners();

}

main().catch((error) => {
  console.error("Error during initialization:", error);
  if (convertMessage) {
    convertMessage.textContent = "Failed to load rates. Please try again later.";
  }
});

function eventListeners(): void {
  if (!convertButton || !swapButton || !amountInput || !fromSelect || !toSelect) {
    return;
  }

  convertButton.addEventListener("click", convertCurrency);
  swapButton.addEventListener("click", swapCurrenciesHandler);
  historyFilter!.addEventListener("change", FilterHistoryHandler);
  clearHistoryButton!.addEventListener("click", ClearHistoryHandler);
  // one listener on the list handles every delete button (event delegation)
  historyList!.addEventListener("click", deleteConversionHandler);

}

function render(state: AppState): void {
  //check other ways to check null
  fromSelect!.value = state.from;
  toSelect!.value = state.to;
  amountInput!.value = state.amount.toString();

  const loading = state.status === "loading";
  convertButton!.disabled = loading;
  if (loading) {
    convertMessage!.textContent = "Loading rates...";
    convertMessage!.style.color = "blue";
  }

  const filteredHistory: Conversion[] = getVisibleHistory(state);
  fillHistoryTable(filteredHistory);
  fillTotalsTable(filteredHistory);

}

function FilterHistoryHandler(): void {
  if (!historyFilter) {
    return;
  }
  // the "All" option has value="" in the HTML
  const selectedFilter = historyFilter.value as CurrencyCode | "";
  store.setState((old) => ({ ...old, filter: selectedFilter === "" ? null : selectedFilter }));

}

function fillHistoryTable(filteredHistory: Conversion[]): void {
  if (!historyList || !historyItemTemplate) {
    return;
  }

  historyList.innerHTML = "";

  for (const conversion of filteredHistory) {

    // importNode() creates a copy of the template content
    // true means deep copy, so it copies the children of the template as well
    const item = document.importNode(historyItemTemplate.content, true);
    const text = item.querySelector<HTMLSpanElement>(".history_item_text");
    const deleteButton = item.querySelector<HTMLButtonElement>(".conversion_delete_button");

    text!.textContent = `${conversion.amount.toFixed(2)} ${conversion.from} = ${conversion.result.toFixed(2)} ${conversion.to}`;
    deleteButton!.setAttribute("data-id", String(conversion.id));

    historyList.appendChild(item);
  }

}

function deleteConversionHandler(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("button.conversion_delete_button");
  if (!button) {
    return;
  }

  const id = Number(button.getAttribute("data-id"));
  store.setState((old) => removeConversion(old, id));
}

function fillTotalsTable(filteredHistory: Conversion[]): void {
  if (!totalConv) {
    return;
  }
  totalConv.textContent = "";

  const totals = getTotals(filteredHistory);

  for (const [currency, total] of Object.entries(totals)) {
    totalConv.textContent += `${total.toFixed(2)} ${currency} | `;
  }

}

function ClearHistoryHandler(): void {
  store.setState((old) => ({ ...old, history: [] }));
}

async function start(): Promise<void> {
  store.setState((old) => ({ ...old, status: "loading" }));
  rates = await loadRates();
  fillSelectOptions();
  convertMessage!.textContent = "";

  //renders again with new status (ready) and enables the convert button
  store.setState((old) => ({ ...old, status: "ready" }));

}

function fillSelectOptions(): void {

  if (!fromSelect || !toSelect) { // Check if the select elements exist
    return;
  }

  for (const code of Object.keys(rates) as CurrencyCode[]) {

    const optionFrom = document.createElement("option");
    optionFrom.value = code;
    optionFrom.textContent = code;
    fromSelect!.appendChild(optionFrom);

    const optionTo = document.createElement("option");
    optionTo.value = code;
    optionTo.textContent = code;
    toSelect!.appendChild(optionTo);

    const optionFilter = document.createElement("option");
    optionFilter.value = code;
    optionFilter.textContent = code;
    historyFilter!.appendChild(optionFilter);
  }

}

function validateConversionInput(): boolean {

  convertMessage!.textContent = "";
  convertResult!.textContent = "";
  convertMessage!.style.color = "red";

  if (!amountInput || !fromSelect || !toSelect) {
    convertMessage!.textContent = "Input elements are missing.";
    return false;
  }
  if (amountInput.value === null || amountInput.value.trim() === "") {
    convertMessage!.textContent = "Please enter an amount.";
    return false;
  }
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount)) {
    convertMessage!.textContent = "Enter a valid number for the amount.";
    return false;
  }
  if (amount < 0) {
    convertMessage!.textContent = "Amount cannot be negative.";
    return false;
  }
  if (amount === 0) {
    convertMessage!.textContent = "Amount cannot be zero.";
    return false;
  }
  return true;

}

function convertCurrency(): void {
  if (!validateConversionInput()) {
    return;
  }
  convertMessage!.textContent = "";
  convertMessage!.style.color = "black";
  const amount = parseFloat(amountInput!.value);
  const fromCurrency = fromSelect!.value as CurrencyCode;
  const toCurrency = toSelect!.value as CurrencyCode;

  const result = convert(amount, fromCurrency, toCurrency, rates);
  convertResult!.textContent = `${result.toFixed(2)} ${toCurrency}`;

  // setState assigns the oldState parameter inside the store then
  // calls the function passed to it with oldState as the argument.
  store.setState((old) =>
    AddConversion({ ...old, from: fromCurrency, to: toCurrency, amount }, result)
  );
}

function swapCurrenciesHandler(): void {
  store.setState((old) => swapCurrencies(old));
  convertCurrency();

}
