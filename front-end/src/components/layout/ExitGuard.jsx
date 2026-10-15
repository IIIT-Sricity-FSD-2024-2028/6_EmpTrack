import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PATHS } from '../../utils/constants';
import Modal from '../common/Modal';

// Asks "Are you sure you want to exit EmpTrack?" when the browser Back button
// would leave the app, instead of silently leaving with the session still open.
//
// A page can't intercept Back once it leaves the document, so the first history
// entry of this page load (React Router stores its position as history.state.idx,
// 0 = first) is turned into a "guard" entry and a copy of the same URL is pushed
// on top of it. Back from the app's first page then lands on the guard - still
// inside the app, firing popstate - and the dialog opens there:
//   - Cancel pushes the copy again, so the user stays on the same page.
//   - Yes, Exit logs out and replaces the guard with /login.
// Back/Forward between pages above the guard is ordinary in-app navigation.
const GUARD_KEY = 'emptrackExitGuard';

const isGuard = (state) => Boolean(state?.[GUARD_KEY]);
const isFirstEntry = (state) => (state?.idx ?? 0) === 0;

// Was this document loaded by Back/Forward (rather than a link, a typed URL or a
// refresh)? Checked once per page load, by the first ExitGuard to mount.
let loadTypeChecked = false;
function loadedByBackForward() {
  if (loadTypeChecked) return false;
  loadTypeChecked = true;
  return performance.getEntriesByType?.('navigation')[0]?.type === 'back_forward';
}

// Chrome's Back button skips history entries a page added before the user ever
// interacted with it, so the copy is pushed only once the page has had a click
// or key press (already true after the Sign in click). Returns a cleanup function.
function whenUserHasInteracted(callback) {
  if (navigator.userActivation?.hasBeenActive ?? true) {
    callback();
    return () => {};
  }
  const events = ['pointerdown', 'keydown'];
  const handler = () => {
    events.forEach((type) => window.removeEventListener(type, handler, true));
    callback();
  };
  events.forEach((type) => window.addEventListener(type, handler, true));
  return () => events.forEach((type) => window.removeEventListener(type, handler, true));
}

export default function ExitGuard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  // Mirrors isOpen synchronously, for the popstate handler and effects that run
  // in the same tick.
  const openRef = useRef(false);

  const setOpen = useCallback((open) => {
    openRef.current = open;
    setIsOpen(open);
  }, []);

  // Push a copy of the current page on top of the guard entry.
  const pushCopy = useCallback(() => {
    const { pathname, search, hash } = window.location;
    navigate({ pathname, search, hash }, { state: window.history.state?.usr ?? null });
  }, [navigate]);

  // Turn the app's first history entry into the guard (once it is reached by
  // ordinary navigation, e.g. the dashboard right after login).
  useEffect(() => {
    const state = window.history.state;
    if (openRef.current || isGuard(state) || !isFirstEntry(state)) return undefined;
    return whenUserHasInteracted(() => {
      const current = window.history.state;
      if (openRef.current || isGuard(current) || !isFirstEntry(current)) return;
      window.history.replaceState({ ...current, [GUARD_KEY]: true }, '');
      pushCopy();
    });
  }, [location.key, pushCopy]);

  // Mounted directly on the guard entry: a refresh of it (push the copy back),
  // or the guard reached by Back after a refresh higher up, which reloads the
  // page instead of firing popstate (ask, as for any other Back).
  useEffect(() => {
    if (openRef.current || !isGuard(window.history.state)) return undefined;
    if (loadedByBackForward()) {
      setOpen(true);
      return undefined;
    }
    return whenUserHasInteracted(() => {
      if (!openRef.current && isGuard(window.history.state)) pushCopy();
    });
  }, [pushCopy, setOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (isGuard(window.history.state)) setOpen(true);
      // Forward from the guard while asking counts as staying.
      else if (openRef.current) setOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setOpen]);

  const handleCancel = () => {
    if (isExiting) return;
    setOpen(false);
    if (isGuard(window.history.state)) pushCopy();
  };

  const handleExit = async () => {
    setIsExiting(true);
    await logout();
    // Replace the guard so Back from /login leaves the app; Forward lands on a
    // protected URL, which ProtectedRoute sends to /login.
    navigate(PATHS.LOGIN, { replace: true });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Exit EmpTrack"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={isExiting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleExit} disabled={isExiting}>
            {isExiting ? 'Exiting...' : 'Yes, Exit'}
          </button>
        </>
      }
    >
      <p className="mb-0">Are you sure you want to exit EmpTrack?</p>
    </Modal>
  );
}
