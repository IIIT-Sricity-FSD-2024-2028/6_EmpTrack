import { cx } from '../../utils/helpers';

/** Controlled search input. onChange receives the string value. */
export default function SearchBar({ value, onChange, placeholder = 'Search...', className, ...rest }) {
  return (
    <div className={cx('search-bar', className)}>
      <i className="ph ph-magnifying-glass"></i>
      <input
        type="text"
        className="form-control"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        {...rest}
      />
      {value && (
        <button type="button" className="search-bar-clear" onClick={() => onChange('')} aria-label="Clear search">
          <i className="ph ph-x"></i>
        </button>
      )}
    </div>
  );
}
