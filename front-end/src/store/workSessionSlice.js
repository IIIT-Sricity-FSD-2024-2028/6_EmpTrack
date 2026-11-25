// The employee's single work timer (GET/POST /worklogs/timer/*). One value, not
// a list, so a plain slice: `session` is always the record the backend last returned.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { workSessionRepository as repo } from '../services/repositories';
import { sessionThunk } from './entitySlice';

// sessionThunk: a timer response from a previous session is dropped (store.js).
const thunk = (type, fn) => createAsyncThunk(`workSession/${type}`, sessionThunk(fn));

export const fetchActiveSession = thunk('fetchActive', repo.getActive);
export const startSession = thunk('start', repo.start);
export const stopSession = thunk('stop', repo.stop);
// Saves the stopped session as a work log; tasks/worklogs slices refetch on it.
export const confirmSession = thunk('confirm', repo.confirm);

const FALLBACK = {
  fetchActive: 'Could not load your active work session.',
  start: 'Could not start the work timer.',
  stop: 'Could not stop the work timer.',
  confirm: 'Could not save the work log.',
};
const SUCCESS = {
  start: 'Work timer started.',
  stop: 'Timer stopped. Add a short summary to save this work log.',
  confirm: 'Work log saved.',
};

const slice = createSlice({
  name: 'workSession',
  initialState: { session: null, loading: true, busy: false, error: '', message: '' },
  reducers: {},
  extraReducers: (builder) => {
    for (const [op, t] of Object.entries({ fetchActive: fetchActiveSession, start: startSession, stop: stopSession, confirm: confirmSession })) {
      builder
        .addCase(t.pending, (state) => {
          if (op === 'fetchActive') state.loading = true;
          else {
            state.busy = true;
            state.message = '';
          }
          state.error = '';
        })
        .addCase(t.fulfilled, (state, action) => {
          state.session = op === 'confirm' ? null : action.payload ?? null;
          state.loading = false;
          state.busy = false;
          if (SUCCESS[op]) state.message = SUCCESS[op];
        })
        .addCase(t.rejected, (state, action) => {
          state.loading = false;
          state.busy = false;
          state.error = action.payload?.message || FALLBACK[op];
        });
    }
  },
});

export default slice.reducer;
