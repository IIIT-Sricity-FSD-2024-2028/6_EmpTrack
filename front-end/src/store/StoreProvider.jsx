import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './store';

/** Provides one store for the lifetime of this mount (created on first render, never replaced). */
export default function StoreProvider({ children }) {
  const store = useRef(null);
  store.current ??= makeStore();
  return <Provider store={store.current}>{children}</Provider>;
}
