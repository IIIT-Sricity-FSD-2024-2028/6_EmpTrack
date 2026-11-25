import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from '../config/config';
import { pageTitleSet } from '../store/store';

/** Sets the title shown in the top header and the browser tab. */
export default function usePageTitle(title) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(pageTitleSet(title));
    document.title = `${config.appName} - ${title}`;
  }, [title, dispatch]);
}
