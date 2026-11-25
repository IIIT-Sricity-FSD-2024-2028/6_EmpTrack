// Authentication state. authService remains the auth repository: POST /auth/login,
// GET /auth/me, POST /auth/logout, and the persisted { user, token, expiresAt }.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import config from '../config/config';
import * as authService from '../services/authService';
import { toError } from './entitySlice';

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    return await authService.login(email, password);
  } catch (err) {
    return rejectWithValue(toError(err));
  }
});

// The server call may fail; authService still clears the local session.
export const logout = createAsyncThunk('auth/logout', () => authService.logout());

// A token restored from storage is not trusted until GET /auth/me confirms it.
// A 401 clears the session via api.js (SESSION_EXPIRED_EVENT); a network error
// keeps it - the backend still checks the token on every request.
export const verifySession = createAsyncThunk('auth/verifySession', () => authService.verifySession());

const sameSession = (a, b) =>
  a?.token === b?.token && a?.expiresAt === b?.expiresAt && a?.user?.emp_id === b?.user?.emp_id && a?.user?.role === b?.user?.role;

export function initialAuthState() {
  const session = authService.getStoredSession();
  return {
    session,
    isVerifying: Boolean(session?.token) && !config.useMockAuth,
    reauthenticationRequired: false,
    error: null,
    // Incremented by the root reducer whenever the signed-in identity changes
    // (store.js); requests carry the value they started with.
    sessionEpoch: 0,
  };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    /** Storage changed (other tab, expiry, bfcache restore): follow it. */
    sessionSynced(state, action) {
      if (!sameSession(state.session, action.payload)) state.session = action.payload;
    },
    sessionExpired(state) {
      state.session = null;
      state.reauthenticationRequired = false;
    },
    requireReauthentication(state) {
      state.reauthenticationRequired = true;
    },
    cancelReauthentication(state) {
      state.reauthenticationRequired = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.session = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload ?? toError(action.error);
      })
      // Hide protected pages (and reset every user-specific slice) immediately;
      // authService.logout still revokes the token server-side with the stored copy.
      .addCase(logout.pending, (state) => {
        state.session = null;
        state.reauthenticationRequired = false;
      })
      .addCase(verifySession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.isVerifying = false;
      })
      .addCase(verifySession.rejected, (state) => {
        state.isVerifying = false;
      });
  },
});

export const { sessionSynced, sessionExpired, requireReauthentication, cancelReauthentication } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (state) => state.auth.session?.user ?? null;
