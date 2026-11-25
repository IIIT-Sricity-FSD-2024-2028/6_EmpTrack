// The application's single Redux store.
import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import auth from './authSlice';
import { ENTITIES } from './entities';
import workSession from './workSessionSlice';

const uiSlice = createSlice({
  name: 'ui',
  // Title shown in the top header; set by pages via usePageTitle().
  initialState: { pageTitle: 'Dashboard' },
  reducers: {
    pageTitleSet(state, action) {
      state.pageTitle = action.payload;
    },
  },
});
export const { pageTitleSet } = uiSlice.actions;

const appReducer = combineReducers({
  auth,
  ui: uiSlice.reducer,
  workSession,
  ...Object.fromEntries(ENTITIES.map((e) => [e.name, e.reducer])),
});

// The signed-in identity: a new login (new token) is a new session even for the same user.
const identityOf = (auth) => `${auth.session?.user?.emp_id ?? ''}|${auth.session?.token ?? ''}`;

/**
 * Whenever the signed-in identity changes (logout, expiry or a 401, a new login,
 * another tab signing in or out) every user-specific slice is reset and
 * auth.sessionEpoch is incremented, so the next user never sees the previous
 * user's records.
 *
 * A request can still be in flight across that change. Data thunks stamp the
 * epoch they started in on their fulfilled/rejected action (entitySlice
 * sessionThunk); one from an earlier epoch is dropped here, before any slice sees it.
 */
export function rootReducer(state, action) {
  const startedIn = action.meta?.sessionEpoch;
  if (state && startedIn !== undefined && startedIn !== state.auth.sessionEpoch) return state;

  const next = appReducer(state, action);
  if (state && identityOf(next.auth) !== identityOf(state.auth)) {
    const auth = { ...next.auth, sessionEpoch: state.auth.sessionEpoch + 1 };
    return appReducer({ auth }, { type: 'session/changed' });
  }
  return next;
}

/** A new store; App creates one per mount (tests get a fresh one each render). */
export const makeStore = () => configureStore({ reducer: rootReducer });

/** @typedef {ReturnType<typeof rootReducer>} RootState */
/** @typedef {ReturnType<typeof makeStore>['dispatch']} AppDispatch */

/** @type {() => AppDispatch} */
export const useAppDispatch = useDispatch;
/** @type {<T>(selector: (state: RootState) => T) => T} */
export const useAppSelector = useSelector;
