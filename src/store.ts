import type { AppState } from './types.ts';

// So any function written like this counts as a Subscriber:
// (state) => { console.log(state.amount); }
type Subscriber = (state: AppState) => void;

export default function createStore(initialState: AppState) {

    // we used let here because we want to be able to change the state variable when setState is called.
    // If we used const, we would not be able to reassign the state variable.
    let state = initialState;

    // every function passed to subscribe is kept here and called when the state changes
    const subscribers: Subscriber[] = [];

    return {
        getState(): AppState {
            return state;
        },

        // receives a function: it is called with the current state, and what it returns becomes the new state
        // - update is the parameter, the thing the caller passes in.
        // - (current: AppState) => AppState is the type of update: a function that takes an AppState named current and returns an AppState.
        // - : void at the end belongs to setState itself. setState returns nothing.
        setState(update: (current: AppState) => AppState): void {
            // recieves a function and calls it with the current state. Whatever that function returns becomes the new state.
            const next = update(state);

            if (next === state) {
                console.log('No change, skipping render');
                return;
            }

            state = next;
            // notifying all subscribers that the state has changed. Each subscriber is a function that takes the new state as an argument.
            subscribers.forEach((subscriber) => subscriber(state));
        },

        // subscribe says "run this function every time the state changes".
        // store.subscribe(render);That line means "whenever the state changes, call render with the new state."
        subscribe(callback: Subscriber): void {
            subscribers.push(callback);
        },
    };
}
