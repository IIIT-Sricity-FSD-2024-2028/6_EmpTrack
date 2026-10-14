import { useEffect } from 'react';
import config from '../config/config';
import { setState } from '../store/store';

/** Sets the title shown in the top header and the browser tab. */
export default function usePageTitle(title) {
  useEffect(() => {
    setState({ pageTitle: title });
    document.title = `${config.appName} - ${title}`;
  }, [title]);
}
