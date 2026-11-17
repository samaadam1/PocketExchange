# Pocket Exchange

A small currency converter written in vanilla TypeScript, built with Vite. No framework.
Type an amount, pick two currencies, press **Convert**, and every conversion is added to a history list
that is saved in the browser and survives a refresh.

## Features

- Convert an amount between EUR, EGP, USD, GBP, SAR and AED (rates are hardcoded, loaded with a fake 1-second delay).
- "Loading rates…" in blue while the rates load; Convert is disabled until they arrive.
- Rejects an empty, zero, negative or non-number amount with a red message.
- **Swap** exchanges From and To and converts again automatically.
- History list (newest first, max 20) with a delete button on each row, a currency filter, a **Clear All** button,
  and totals per currency: `7,696.74 EGP | 25.32 USD`.
- History is saved to `localStorage` on every change and loaded when the app starts. Broken saved data never stops the app.

## Run it

```bash
npm install
npm run dev        # then open http://localhost:5173/
npm run build      # type-checks (tsc) and builds into dist/
```

Open the `localhost` address, not `index.html` directly. Browsers can't run `.ts` files, and Vite is what compiles them.

### TypeScript vs JavaScript

JavaScript is the language browsers run. TypeScript is JavaScript with **types** added on top. You write the types, TypeScript
checks them while you work, and then they are removed to produce plain JavaScript. The browser never sees TypeScript.

```ts
// TypeScript: the types say what goes in and what comes out
function validateAmount(raw: string): string | null { ... }

validateAmount(5);   // error in the editor, before running: 5 is a number, not a string
```

```js
// JavaScript: the same function without types
function validateAmount(raw) { ... }

validateAmount(5);   // runs, and the mistake only shows up later (for example: raw.trim is not a function)
```

| | JavaScript | TypeScript |
|---|---|---|
| Runs in the browser | directly | no, it is compiled to JavaScript first |
| Mistakes with types | found when the code runs | found in the editor, as you type |
| Extra work | none | a build step (Vite handles it) and writing the types |

This project uses TypeScript with `strict` mode on, so mistakes such as using a value that might be `null` are errors.

### What is Vite?

Vite is the development tool that sits between the TypeScript code and the browser. It does two jobs:

1. **Dev server (`npm run dev`).** It serves the project at `http://localhost:5173/`. When the browser asks for
   `/src/main.ts`, Vite turns the TypeScript into plain JavaScript on the fly, and serves each imported file
   (`state.ts`, `rates.ts`, ...) when it is requested. When a file is saved, the page reloads by itself.
2. **Bundler (`npm run build`).** It combines the files into a few small, optimized files in `dist/`, ready to put on a website.

`localhost` is still your own computer. Nothing is sent to the internet.

Vite only removes the types. It does **not** check them. Type errors are found by `tsc`, which is why the build script is
`tsc && vite build`, and why `npx tsc --noEmit` is worth running while developing.

### Why a second terminal?

`npm run dev` does not finish. It is a server, so it keeps running for as long as you want to use the app, and the
terminal it started in is busy until you stop it with **Ctrl + C**. That is why any other command, such as
`npx tsc --noEmit`, needs a second terminal. You can also stop the server first and run the command in the same terminal,
but then the app stops working until you start the server again.

| Terminal | What runs there |
|---|---|
| 1 | `npm run dev` (leave it running) |
| 2 | other commands, such as `npx tsc --noEmit` or `git` |

## Project structure

| File | Role |
|---|---|
| `index.html` | The page structure. Loads `src/main.ts`. |
| `src/style.css` | Layout (420px centered column, flex rows) and the history list look. |
| `src/types.ts` | `Conversion`, `AppState`, `CurrencyCode`, `Status`. Types only. |
| `src/rates.ts` | `RATES` (units per 1 USD) and `loadRates()`, which resolves after 1 second like a real API. |
| `src/state.ts` | The rules, as pure functions that take a state and return a **new** one: `convert`, `validateAmount`, `addConversion`, `removeConversion`, `clearHistory`, `swapCurrencies`, `getFilteredHistory`, `getTotals`, `createIdGenerator`. |
| `src/storage.ts` | `saveHistory` / `loadHistory` using `localStorage`, with an `isConversion` check on every loaded entry. |
| `src/store.ts` | `createStore` (the only default export): `getState`, `setState`, `subscribe`. |
| `src/main.ts` | The only file that touches the page: finds the elements, draws the page, handles the clicks. |

`src/counter.ts`, `src/assets/` and `public/icons.svg` are leftovers from the Vite starter template and are not used.

## How it works

The screen only changes through `setState`. Rendering runs as a subscriber.

```
user clicks Convert
  -> handler in main.ts calls store.setState(...) with a function from state.ts
  -> store.ts saves the new state and calls every subscriber
  -> render(state) redraws the page      |  saveHistory(state.history) writes to localStorage
```

- `setState` receives a function. It calls it with the current state and uses the returned object as the new state.
- If the function returns the **same object**, nothing is updated and the console prints `No change, skipping render`.
- State is never mutated. Every update builds a new object (`{ ...state, ... }`) and a new array.
- There is **one** click listener on the whole history list (event delegation). It finds the delete button with
  `closest('button.delete')` and reads the conversion id from `data-id`.

### Code rules used in this project

- TypeScript `strict` mode is on, and there is no `any`.
- `const` by default. Every `let` has a comment saying why.
- Only `===` and `!==`.
- Only `store.ts` uses a default export. Every other file uses named exports.

## Testing

Everything below was checked by running the app. The browser scripts were run in headless Edge against `npm run dev`;
they are not part of the repository.

### Type check

```
npx tsc --noEmit        # no output = no errors
```

### Unit-style checks of the pure functions (run in Node)

| Function | Input | Output |
|---|---|---|
| `convert` | 100 EUR -> EGP | `5271.739130434782` (shown as `5,271.74`) |
| `convert` | 100 EUR -> EUR | `100` (same currency returns the same amount) |
| `validateAmount` | `""` / `"   "` | `Enter an amount` |
| `validateAmount` | `"0"`, `"0.0"` | `Amount cannot be zero` |
| `validateAmount` | `"-5"` | `Amount cannot be negative` |
| `validateAmount` | `"abc"`, `"12abc"`, `"NaN"`, `"Infinity"` | `Amount must be a number` |
| `validateAmount` | `"5"`, `"0.01"`, `" 100 "`, `"1e3"` | `null` (valid) |
| `addConversion` | 25 adds | length stays **20**, newest on top, oldest dropped |
| `getFilteredHistory` | filter `EUR` on EUR->EGP, USD->EUR, GBP->USD, EGP->EUR | 3 entries (EUR on either side) |
| `getTotals` | 100 EUR->EGP (5271.74), 100 EGP->EUR (1.9), 50 EUR->EGP (2635.87), 10 USD->GBP (7.9) | `{ EGP: 7907.61, EUR: 1.9, GBP: 7.9 }` |
| `createIdGenerator` | three calls, then a "refresh" (new generator) | `1, 2, 3`, then `4, 5` |

### Proof that state is not mutated

After adding a conversion, are the new state, the new history array and the old items the same objects as before?
This can be checked in the browser Console on the running app (paste it **one line at a time**):

```js
const { addConversion } = await import('/src/state.ts')
const a = { id: '1', from: 'EUR', to: 'EGP', amount: 1, result: 2, date: 'd' }
const oldState = { from: 'EUR', to: 'EGP', amount: 0, history: [a], filter: null, status: 'ready' }
const newState = addConversion(oldState, { id: '2', from: 'USD', to: 'EUR', amount: 1, result: 2, date: 'd' })
console.log(newState === oldState, newState.history === oldState.history, newState.history[1] === a)
console.log(oldState.history.length, newState.history.length)
```

Output:

```
false false true
1 2
```

- `false false`: the state and the history array are **new** objects, so the store sees a change and renders.
- `true`: the old item is the **same** object, reused and not copied (a shallow copy).
- `1 2`: the old history still has 1 item, so it was not changed, and the new one has 2.

### Console logs in `addConversion`

While checking the history, `addConversion` printed this on every added conversion:

```
History size: 0 -> 1
Same state object? false (a new state was created, so the store sees a change)
Same history array? false (a new array was created, the old array is untouched)
Same old items? true (the items are reused, not copied. Only the arrays are new)
```

| Action | Console output |
|---|---|
| Page loads, rates arrive | nothing |
| Convert | `History size: 0 -> 1` |
| Convert again | `History size: 1 -> 2` |
| Swap (adds a conversion) | `History size: 2 -> 3` |
| Change a dropdown | nothing |
| Add to a full history | `History size: 20 -> 20` |

These logs are debugging output and can be removed from `src/state.ts` (see "Known limitations").

### localStorage tests

Where to look: DevTools (F12) -> **Application** -> **Local Storage** -> `http://localhost:5173`.

| Key | Holds |
|---|---|
| `pocket-exchange:history` | the history as JSON |
| `pocket-exchange:last-id` | the last id that was handed out |

What the saved history looks like (newest first):

```
[{id: "40c06bf6-...", from: "EUR", to: "EGP", amount: 2, ...},
 {id: "9ed268a3-...", from: "EUR", to: "EGP", amount: 1,
  result: 52.71739130434782, date: "2026-11-16T16:36:21.106Z"}]
```

(That sample is from before the id counter was connected. New entries get ids `1`, `2`, `3`, ...)

**The `abc` test: a broken saved value must not stop the app.**

1. Convert once so `pocket-exchange:history` exists.
2. Double-click its **Value** in the Application tab, replace everything with `abc`, press Enter.
   (Or in the Console: `localStorage.setItem('pocket-exchange:history', 'abc')`.)
3. Reload with F5.

Result: **the app starts normally with an empty list `[]`**. The rates load, Convert works, the result line shows the
placeholder `0.00 EGP`, and there are no errors in the Console. The next Convert replaces `abc` with a valid saved list.

Why it works: `JSON.parse('abc')` throws, the `catch` in `loadHistory` returns `[]`, and the rest of the app only ever
receives an array.

| Saved value | `loadHistory()` returns |
|---|---|
| nothing saved | `[]` |
| `abc` (not valid JSON) | `[]` |
| `{"a":1}` (valid JSON, not a list) | `[]` |
| `[good entry, {"id":"x"}, 5, null, {amount:"100"}]` | only the good entry |
| localStorage blocked | `[]` (saving does not crash either) |
| a valid saved list | the same entries, same order (they are copies read back from text) |

### Browser tests (headless Edge, against the running app)

| Step | Result |
|---|---|
| Page loads | blue `Loading rates…`, Convert disabled, dropdowns empty |
| After about 1 second | message cleared, Convert enabled, dropdowns hold USD, EUR, GBP, SAR, AED, EGP (EUR and EGP selected) |
| Convert with an empty amount | red `Enter an amount`, result line empty |
| Amount `0` / `-5` | red `Amount cannot be zero` / `Amount cannot be negative` |
| `100` EUR -> EGP | `100 EUR = 5,271.74 EGP` |
| `100` GBP -> USD | `100 GBP = 126.58 USD` |
| Swap after converting `100` EUR -> EGP | `EGP -> EUR`, result `100 EGP = 1.90 EUR` |
| Swap again | `EUR -> EGP`, result `100 EUR = 5,271.74 EGP` |
| Swap with no valid amount | currencies swap, result line empty, no error |
| Convert x3, filter `USD` | only the entries with USD on either side; the totals follow the filter |
| Delete the newest row | 2 rows left |
| Refresh | the same 2 rows (saved) |
| Clear All | empty list, Totals `0.00`, Clear All disabled |
| Ids after Convert, Convert, Swap, refresh, Convert | `1`, then `3, 2, 1`, then `4, 3, 2, 1` |

Totals example (conversions into each currency, alphabetical):

| Action | Totals |
|---|---|
| nothing yet | `0.00` |
| 100 EUR -> EGP | `5,271.74 EGP` |
| + 50 USD -> EGP | `7,696.74 EGP` |
| + 20 GBP -> USD | `7,696.74 EGP \| 25.32 USD` |

## Problems I faced and how they were solved

### 1. The old result stayed on screen

**Problem.** After a conversion, the result line kept showing the old result while I tried a new amount, and after an
error (empty or negative amount) the old result was still sitting under the red message.

**Why.** The result line is drawn from the newest entry in the history. Nothing told it to disappear when a new
attempt started.

**Solution.**
- The Convert click clears the result line first (`ConversionResult.textContent = ''`), and `render` writes the new one
  after a valid conversion. With an error, the result stays empty.
- The result is only shown while the newest conversion matches the selected currencies, so changing From or To also
  clears it.

**Limit.** The result is cleared when Convert is pressed, not while typing in the amount box.

### 2. Swap did not show the new result

**Problem.** Pressing Swap only exchanged the two dropdowns. The old result stayed, and it described the opposite
direction, so the page showed a wrong or stale answer.

**Why.** `swapCurrencies` only changes `from` and `to` in the state. It never converted anything, so no new history
entry existed.

**Solution.** The Swap handler now swaps the currencies, clears the old result, and, if the amount is valid, converts
again through the same `addNewConversion` function that Convert uses. The new result appears automatically and the swap is
added to the history. With an empty or invalid amount it only swaps and shows no error, because there is nothing to convert.

### 3. Flex row or table for the history list?

**Decision.** A list (`<ul>` with `<li>` rows) with a flex row.

**Why.**
- Each entry is one line of text (`100 EUR -> 5,271.74 EGP`) plus a delete button. There is one piece of information per
  row, not several columns.
- The `<ul id="history_list">` was already in the HTML.
- A row with `display: flex; justify-content: space-between` puts the calculation on the left and the delete button on the right.

**Result.**

```css
#history_list { list-style: none; padding: 0; margin: 0; width: 100%; }
#history_list li { display: flex; justify-content: space-between; align-items: center; }
```

A table would be the better choice if each part were its own column (amount, from, to, result, date) with headings or sorting.

### Other things that came up

- **Nothing happened when opening the HTML file.** The code is TypeScript, so the page has to be opened through the Vite
  server at `http://localhost:5173/`. Also, the code changes the page in the browser, never the `index.html` file.
- **The history list was empty at first.** The history was saved, but no code drew it. `render` had to build the rows.
- **Pasting code into the Console failed** with `SyntaxError: Unexpected identifier 'd'`. Parts of the long lines were
  lost in the copy. Pasting the lines one at a time worked.
- **Ids were long random codes.** `crypto.randomUUID()` was still used. It was replaced with the counter from
  `createIdGenerator`, which starts at 1 and keeps counting after a refresh.

## Known limitations

- Rates are hardcoded. `loadRates()` only imitates an API.
- The three `console.log` lines in `addConversion` (`src/state.ts`) are debugging output and can be deleted.
- The Totals box follows the selected filter.
- Converting the same entry back and forth with Swap adds a history entry each time.
- The history list has no styling beyond the layout (no delete-button style).
- Unused Vite starter files: `src/counter.ts`, `src/assets/`, `public/icons.svg`.
