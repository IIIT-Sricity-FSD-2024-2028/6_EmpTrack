import { useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';

/**
 * Replaces the original hidden #page-title block: sets the header title and the
 * browser tab title. The portal caption ("Technical Dashboard") is already shown
 * under the header title by the Layout, so nothing is rendered in the page.
 * tabTitle: full browser-tab title, e.g. 'EmpTrack - Assigned Issues'
 */
export default function SaPageTitle({ title, tabTitle }) {
  usePageTitle(title);
  useEffect(() => {
    if (tabTitle) document.title = tabTitle;
  }, [tabTitle]);
  return null;
}
