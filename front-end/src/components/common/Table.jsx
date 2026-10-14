import { cx } from '../../utils/helpers';

/**
 * Data table in the pages' "table-modern" style.
 *
 * columns:  [{ key, header, render?: (row) => node, headerStyle?, cellStyle? }]
 * data:     array of row objects
 * rowKey:   field name or (row, index) => key
 * rowStyle: optional (row) => style object for a row
 * title:    renders the table inside a .card with a header (implies `card`)
 * card:     wrap the table in a .card.table-modern without a header
 */
export default function Table({
  columns,
  data = [],
  rowKey = 'id',
  rowStyle,
  emptyMessage = 'No records found.',
  title,
  headerStyle,
  card = false,
  className,
  style,
}) {
  const getKey = (row, index) => (typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] ?? index);

  const table = (
    <div className="table-container table-modern-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.headerStyle}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="table-empty-cell" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={getKey(row, index)} style={rowStyle?.(row)}>
                {columns.map((col) => (
                  <td key={col.key} style={col.cellStyle}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (!title && !card) return table;

  return (
    <div className={cx('card table-modern', className)} style={{ padding: 0, overflow: 'hidden', ...style }}>
      {title && (
        <div className="table-card-header" style={headerStyle}>
          <h3>{title}</h3>
        </div>
      )}
      {table}
    </div>
  );
}
