import type { AppState } from "./types";

export default function createStore(initialState: AppState) {
    let state = initialState;
    let subscribers: Array<(state: AppState) => void> = [];

    function getState(): AppState {
        return state;
    }

    function setState(func: (oldState: AppState) => AppState): void {
        const oldState = state;
        let newState: AppState; // assigned to func(oldState) below

        newState = func(oldState);
        if (newState === oldState) {
            console.log("No change, skipping render");
            return;

        }
        state = newState;
        //look for mapping here, foroff, forin
        subscribers.forEach((subscriber) => subscriber(state));

    }

    function subscribe(subscriber: (state: AppState) => void): void {
        if (subscribers.includes(subscriber)) {
            console.log("Subscriber already exists, skipping");
            return;
        }
        subscribers.push(subscriber);

    }

    return { getState, setState, subscribe };

}
