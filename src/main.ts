import { loadRates } from "./rates";
import { convert } from "./state";
import type { CurrencyCode } from "./types";

let rates: Record<CurrencyCode, number>; // rates are assigned later, in start(),


const fromSelect = document.querySelector<HTMLSelectElement>("#from");
const toSelect = document.querySelector<HTMLSelectElement>("#to");
const swapButton = document.querySelector<HTMLButtonElement>("#swap");
const amountInput = document.querySelector<HTMLInputElement>("#amount");
const convertButton = document.querySelector<HTMLButtonElement>("#convert");
const convertResult = document.querySelector<HTMLOutputElement>("#result");
const convertMessage = document.querySelector<HTMLOutputElement>("#message");


async function main(): Promise<void> {

  await start();
  eventListeners();
}

main().catch((error) => {
  console.error("Error during initialization:", error);
  if (convertMessage) {
    convertMessage.textContent = "Failed to load rates. Please try again later.";
  }
});


async function start(): Promise<void> {
  convertButton!.disabled = true;
  convertMessage!.textContent = "Loading rates...";
  convertMessage!.style.color = "blue";
  rates = await loadRates();
  convertMessage!.textContent = "";
  convertButton!.disabled = false;
  fillSelectOptions();
}

function eventListeners(): void {
  if (!convertButton || !swapButton || !amountInput || !fromSelect || !toSelect) {
    return;
  }

  convertButton.addEventListener("click", convertCurrency);

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
}

function render(): void {

}




