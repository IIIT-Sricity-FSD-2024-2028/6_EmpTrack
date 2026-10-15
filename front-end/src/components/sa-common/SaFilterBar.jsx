import { useState } from 'react';
import useDebouncedCallback from './useDebouncedCallback';

/**
 * The original .filter-bar card: debounced search box (350ms), any filter
 * selects passed as children, and a Clear button.
 * onSearch(term) gets the trimmed term; onClear resets the page's other filters.
 */
export default function SaFilterBar({ placeholder, onSearch, onClear, children, searchId = 'search-input' }) {
  const [term, setTerm] = useState('');
  const debouncedSearch = useDebouncedCallback(onSearch, 350);

  const clear = () => {
    debouncedSearch.cancel();
    setTerm('');
    onClear();
  };

  return (
    <div className="card filter-bar">
      <div className="search-wrap">
        <i className="ph ph-magnifying-glass"></i>
        <input
          type="text" maxLength={100} id={searchId} className="search-input" placeholder={placeholder} aria-label={placeholder} value={term}
          onChange={(e) => { setTerm(e.target.value); debouncedSearch(e.target.value.trim()); }}
        />
      </div>
      <div className="filters-wrap">
        {children}
        <button type="button" className="btn-clear" id="btn-clear-filters" onClick={clear}><i className="ph ph-x"></i> Clear</button>
      </div>
    </div>
  );
}
