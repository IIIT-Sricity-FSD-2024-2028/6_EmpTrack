import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async loader on mount (and whenever `deps` change).
 * Returns { data, loading, error, reload }.
 *
 *   const { data: tasks = [], reload } = useFetch(() => getTasksForUser(user.emp_id), [user.emp_id]);
 */
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });

  // `deps` decide when the loader is considered new (like useEffect deps).
  const load = useCallback(loader, deps);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await load();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { ...state, reload };
}
