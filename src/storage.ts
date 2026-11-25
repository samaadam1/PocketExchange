
import { getLastId } from "./state";
import type { AppState } from "./types";

export function saveHistory(state: AppState): void {
    const history = state.history;
    localStorage.setItem("history", JSON.stringify(history));

}

export function loadHistory(): Record<string, any> | null {

    const history = localStorage.getItem("history");
    if (history) {
        return { history: JSON.parse(history) };
    }
    return null;
}

export function loadLastId(): number {

    const saved = Number(localStorage.getItem("lastId"));
    return Number.isInteger(saved) ? saved : 0;

}

export function saveLastId(): void {
    const lastSavedId = Number(localStorage.getItem("lastId"));
    const currentLastId = getLastId();
    const id = Math.max(lastSavedId, currentLastId);
    localStorage.setItem("lastId", String(id));

}