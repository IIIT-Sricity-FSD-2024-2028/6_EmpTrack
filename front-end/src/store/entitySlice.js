// Builds one Redux slice per backend entity: records are normalized with
// createEntityAdapter, and every fetch (e.g. "tasks for EM001", "HR review
// queue") keeps its own list of ids + status/error under `queries`, because the
// backend scopes lists by user/role/company and records don't always carry the
// owner field needed to filter one global list.
//
// Data flow: component -> dispatch(thunk) -> repository -> backend -> fulfilled
// -> state. Nothing is written before the backend confirms it; a rejected thunk
// leaves existing records untouched and stores the error.
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

/** Rejection payload: keeps ApiError's status + per-field errors for forms. */
export const toError = (err) => ({
  message: err?.message || 'Request failed.',
  status: err?.status ?? null,
  fieldErrors: err?.fieldErrors ?? null,
});

/**
 * Payload creator for every data thunk. It records the session the request started
 * in (auth.sessionEpoch) on the fulfilled/rejected action, so the root reducer can
 * drop a response that arrives after logout or an account switch (store.js).
 */
export const sessionThunk = (fn) => async (arg, { getState, fulfillWithValue, rejectWithValue }) => {
  const meta = { sessionEpoch: getState().auth?.sessionEpoch };
  try {
    return fulfillWithValue(await fn(arg), meta);
  } catch (err) {
    return rejectWithValue(toError(err), meta);
  }
};

export const queryKey = (op, arg) => `${op}:${arg === undefined ? '' : JSON.stringify(arg)}`;

/**
 * queries:   { opName: (arg) => Promise<array | record | value> }
 * mutations: { opName: { run: (arg) => Promise, kind: 'create' | 'update' | 'delete' | 'action', id?: (arg) => id } }
 *   action - no record change (e.g. password change); only its status/error are tracked
 * invalidatedBy: other slices' thunks whose success changes this entity on the backend
 *   (e.g. confirming a work timer creates a work log) - every list here is refetched.
 *   create - stores the returned record, marks lists stale so they refetch from the backend
 *   update - stores the returned record (or marks lists stale if the backend returns no record)
 *   delete - removes id(arg) only after the backend confirms
 *   refetch: true - also refetch every list (server-filtered lists such as a review queue)
 */
export function createEntitySlice({ name, idKey, queries = {}, mutations = {}, invalidatedBy = [] }) {
  const adapter = createEntityAdapter({ selectId: (r) => r[idKey] });
  const isRecord = (v) => v && typeof v === 'object' && !Array.isArray(v) && v[idKey] != null;
  const thunks = {};

  for (const [op, fn] of Object.entries(queries)) {
    thunks[op] = createAsyncThunk(`${name}/${op}`, sessionThunk(fn), {
      // One request per query at a time (StrictMode double effects, several widgets).
      condition: (arg, { getState }) => getState()[name].queries[queryKey(op, arg)]?.status !== 'loading',
    });
  }
  for (const [op, def] of Object.entries(mutations)) {
    thunks[op] = createAsyncThunk(`${name}/${op}`, sessionThunk(def.run));
  }

  const markAllStale = (state) => Object.values(state.queries).forEach((q) => { q.stale = true; });

  const slice = createSlice({
    name,
    initialState: adapter.getInitialState({ queries: {}, mutations: {} }),
    reducers: {},
    extraReducers: (builder) => {
      for (const op of Object.keys(queries)) {
        const key = (action) => queryKey(op, action.meta.arg);
        builder
          .addCase(thunks[op].pending, (state, action) => {
            const q = (state.queries[key(action)] ??= { ids: [], value: null, loaded: false });
            q.status = 'loading';
            q.error = null;
          })
          .addCase(thunks[op].fulfilled, (state, action) => {
            const q = state.queries[key(action)];
            const data = action.payload;
            // Lists of records are normalized; anything else (e.g. ['Billing', ...]) is a plain value.
            if (Array.isArray(data) && data.every(isRecord)) {
              adapter.upsertMany(state, data);
              q.ids = data.map((r) => r[idKey]);
            } else if (isRecord(data)) {
              adapter.upsertOne(state, data);
              q.ids = [data[idKey]];
            } else {
              q.value = data ?? null;
            }
            Object.assign(q, { status: 'succeeded', loaded: true, stale: false });
          })
          .addCase(thunks[op].rejected, (state, action) => {
            const q = state.queries[key(action)];
            Object.assign(q, { status: 'failed', error: action.payload ?? toError(action.error), stale: false });
          });
      }
      for (const [op, def] of Object.entries(mutations)) {
        builder
          .addCase(thunks[op].pending, (state) => {
            state.mutations[op] = { status: 'loading', error: null };
          })
          .addCase(thunks[op].fulfilled, (state, action) => {
            state.mutations[op] = { status: 'succeeded', error: null };
            if (def.kind === 'delete') {
              const id = def.id(action.meta.arg);
              adapter.removeOne(state, id);
              Object.values(state.queries).forEach((q) => { q.ids = q.ids.filter((x) => x !== id); });
              return;
            }
            if (isRecord(action.payload)) adapter.upsertOne(state, action.payload);
            if (def.kind === 'create' || def.refetch || (def.kind === 'update' && !isRecord(action.payload))) markAllStale(state);
          })
          .addCase(thunks[op].rejected, (state, action) => {
            state.mutations[op] = { status: 'failed', error: action.payload ?? toError(action.error) };
          });
      }
      for (const thunk of invalidatedBy) builder.addCase(thunk.fulfilled, markAllStale);
    },
  });

  return { name, reducer: slice.reducer, thunks, adapter };
}

const EMPTY = [];

/**
 * Reads a query from an entity slice, fetching on mount, when `arg` changes and
 * when a mutation marked it stale. Returns { data, loading, error, reload }.
 * `loading` is true only until the first response; later refetches keep showing
 * the current records.
 *
 *   const { data: tasks = [] } = useEntityQuery(tasksEntity, 'fetchForUser', user.emp_id);
 */
export function useEntityQuery(entity, op, arg, { skip = false } = {}) {
  const dispatch = useDispatch();
  const key = queryKey(op, arg);
  const q = useSelector((s) => s[entity.name].queries[key]);
  const entities = useSelector((s) => s[entity.name].entities);

  const reload = () => dispatch(entity.thunks[op](arg));
  useEffect(() => {
    if (!skip) dispatch(entity.thunks[op](arg));
    // `key` captures arg.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip]);
  useEffect(() => {
    if (!skip && q?.stale) dispatch(entity.thunks[op](arg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.stale, skip]);

  const ids = q?.ids ?? EMPTY;
  const records = useMemo(() => ids.map((id) => entities[id]).filter(Boolean), [ids, entities]);
  const hasValue = q?.value !== null && q?.value !== undefined;
  return {
    data: !q?.loaded ? undefined : hasValue ? q.value : records,
    loading: !skip && !q?.loaded && q?.status !== 'failed',
    error: q?.status === 'failed' ? q.error : null,
    reload,
  };
}
