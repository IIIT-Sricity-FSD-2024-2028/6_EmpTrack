// Minimal shared app state (no external library).
// Read in components:  const title = useStore((s) => s.pageTitle);
// Update anywhere:     setState({ pageTitle: 'Leave Request' });
// Selectors should return primitives or stable references.
import { useSyncExternalStore } from 'react';

const initialState = {
  // Title shown in the top header; set by pages via usePageTitle().
  pageTitle: 'Dashboard',
};

let state = { ...initialState };
const listeners = new Set();

export function getState() {
  return state;
}

/** Accepts a partial object or an updater fn: setState((s) => ({ ...changes })). */
export function setState(partial) {
  const changes = typeof partial === 'function' ? partial(state) : partial;
  state = { ...state, ...changes };
  listeners.forEach((listener) => listener());
}

export function resetState() {
  setState(initialState);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore(selector = (s) => s) {
  const getSnapshot = () => selector(state);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
