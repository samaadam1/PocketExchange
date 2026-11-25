# Pocket Exchange

A small currency converter built with TypeScript and Vite, with no UI framework.
Convert an amount between currencies, keep a history of conversions, and see
totals per currency.

## Features

- Convert between USD, EUR, GBP, SAR, AED and EGP
- Swap the "from" and "to" currencies
- Input validation: empty, non-numeric, zero and negative amounts are rejected with a message
- History list, newest first, capped at the latest 20 conversions
- Filter the history by currency
- Delete a single conversion or clear the whole history
- Totals per currency for the conversions shown
- History is saved in `localStorage` and restored on refresh

## Getting started

```
npm install
npm run dev
```

Open the local URL that Vite prints (usually http://localhost:5173).

| Command           | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload        |
| `npm run build`   | Type-check with `tsc`, then build with Vite |
| `npm run preview` | Serve the production build locally          |

To type-check only: `npx tsc --noEmit`.

## How it works

State lives in one small store. The flow is always the same:

1. A DOM event (click, change) calls `store.setState(fn)`.
2. `fn` receives the old state and returns a **new** state object. Nothing is mutated.
3. The store notifies its subscribers.
4. `render(state)` redraws the page from that state, and `saveHistory(state)` writes the history to `localStorage`.

## Project structure

| File             | Purpose                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `index.html`     | Page markup, including the `<template>` used for history rows                    |
| `src/main.ts`    | Entry point: DOM lookups, event handlers, `render`                               |
| `src/store.ts`   | `createStore()`: private state with `getState`, `setState` and `subscribe`       |
| `src/state.ts`   | Pure state functions (`AddConversion`, `removeConversion`, `getTotals`, ...) and id generation |
| `src/storage.ts` | Saving and loading from `localStorage`                                           |
| `src/rates.ts`   | Exchange rates (static, relative to USD) and a simulated async `loadRates()`     |
| `src/types.ts`   | Shared types: `CurrencyCode`, `Conversion`, `AppState`                           |
| `src/style.css`  | Styles                                                                           |

## Notes

- The rates are hardcoded in `src/rates.ts`, not fetched from a live service.
  To add a currency, add it to `CurrencyCode` in `types.ts` and to `RATES` in `rates.ts`.
- `tsconfig.json` has `strict` on, and the project avoids `any`.
