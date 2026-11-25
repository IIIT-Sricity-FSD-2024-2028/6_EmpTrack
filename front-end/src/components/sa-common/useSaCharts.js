import { useEffect, useMemo, useState } from 'react';
import { chartTheme, loadChartJs } from '../../utils/saCommon';

/**
 * Chart.js configs for SaChartCard, built from Redux queries ({ data, error }).
 * builders[key](data, theme) turns a query's backend data into a config. In the
 * result a key is absent while loading and null if its request (or build) failed,
 * so each chart loads independently, as in the original pages.
 */
export default function useSaCharts(queries, builders, onLibraryError) {
  // Whether the Chart.js script has loaded - library state, not backend data.
  const [libraryReady, setLibraryReady] = useState(false);
  useEffect(() => {
    let active = true;
    loadChartJs()
      .then(() => active && setLibraryReady(true))
      .catch(() => active && onLibraryError?.());
    return () => {
      active = false;
    };
    // Load once per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keys = Object.keys(queries);
  const inputs = keys.flatMap((k) => [queries[k].data, queries[k].error]);
  return useMemo(() => {
    if (!libraryReady) return {};
    const theme = chartTheme();
    const charts = {};
    for (const key of keys) {
      const { data, error } = queries[key];
      if (error) charts[key] = null;
      else if (data) {
        try {
          charts[key] = builders[key](data, theme);
        } catch {
          charts[key] = null;
        }
      }
    }
    return charts;
    // `inputs` covers every query's data and error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryReady, ...inputs]);
}
