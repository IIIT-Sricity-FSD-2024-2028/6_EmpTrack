import { useEffect, useMemo, useRef } from 'react';

/**
 * Debounced version of fn (sa-common debounce). The returned function has a
 * .cancel() to drop a pending call; pending calls are dropped on unmount.
 */
export default function useDebouncedCallback(fn, delay = 300) {
  const fnRef = useRef(fn);
  const timerRef = useRef(null);
  fnRef.current = fn;

  const debounced = useMemo(() => {
    const call = (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    };
    call.cancel = () => clearTimeout(timerRef.current);
    return call;
  }, [delay]);

  useEffect(() => () => clearTimeout(timerRef.current), []);
  return debounced;
}
