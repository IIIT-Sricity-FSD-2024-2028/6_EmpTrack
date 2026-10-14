// Inline-SVG charts for the Support Member dashboard (the original drew a Chart.js
// doughnut and bar chart; this repo renders charts without a chart library).
// Colours are the original ones. Every mark has a hover tooltip and the doughnut
// has a legend with counts, so identity never relies on colour alone.

const EMPTY = <div className="ops-chart-empty">No tickets yet.</div>;

/** data: [{ label, value, color }] */
export function DoughnutChart({ data, label }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const R = 80;
  const r = 52;
  const GAP = 0.02; // radians of surface between segments

  let angle = -Math.PI / 2;
  const arcs = data.filter((d) => d.value > 0).map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const a0 = angle + (sweep < Math.PI * 2 ? GAP / 2 : 0);
    const a1 = angle + sweep - (sweep < Math.PI * 2 ? GAP / 2 : 0.0001);
    angle += sweep;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad, a) => `${(rad * Math.cos(a)).toFixed(2)} ${(rad * Math.sin(a)).toFixed(2)}`;
    return {
      ...d,
      path: `M ${p(R, a0)} A ${R} ${R} 0 ${large} 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 ${large} 0 ${p(r, a0)} Z`,
    };
  });

  return (
    <figure className="ops-chart" aria-label={label}>
      {total === 0 ? EMPTY : (
        <svg viewBox="-90 -90 180 180" role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
          {arcs.map((a) => (
            <path key={a.label} d={a.path} fill={a.color} className="ops-chart-mark">
              <title>{`${a.label}: ${a.value} (${Math.round((a.value / total) * 100)}%)`}</title>
            </path>
          ))}
          <text y="-2" textAnchor="middle" style={{ fill: 'var(--text-main)', fontSize: 22, fontWeight: 700 }}>{total}</text>
          <text y="16" textAnchor="middle" className="ops-chart-axis">tickets</text>
        </svg>
      )}
      <figcaption className="ops-chart-legend">
        {data.map((d) => (
          <span key={d.label}><i className="ops-chart-swatch" style={{ background: d.color }}></i>{d.label} ({d.value})</span>
        ))}
      </figcaption>
    </figure>
  );
}

/** data: [{ label, value }] - one series, so no legend; the card title names it. */
export function BarChart({ data, color, label }) {
  const W = 420;
  const H = 200;
  const PAD = { top: 12, right: 8, bottom: 28, left: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = Math.max(1, Math.ceil(max / 4));
  const ticks = [];
  for (let t = 0; t <= max; t += step) ticks.push(t);
  const top = ticks[ticks.length - 1] < max ? ticks[ticks.length - 1] + step : ticks[ticks.length - 1];
  if (top !== ticks[ticks.length - 1]) ticks.push(top);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(36, slot - 4);
  const y = (v) => PAD.top + plotH - (v / top) * plotH;
  // Horizontal labels truncated to their slot (~6.5px per char at 11px); the full
  // name is in the hover tooltip and the aria-label.
  const maxChars = Math.max(3, Math.floor(slot / 6.5));
  const short = (s) => (s.length > maxChars ? `${s.slice(0, maxChars - 1)}…` : s);

  return (
    <figure className="ops-chart" aria-label={label}>
      {data.length === 0 ? EMPTY : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="ops-chart-grid" />
              <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" className="ops-chart-axis">{t}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            const h = Math.max(0, y(0) - y(d.value));
            const r = Math.min(4, barW / 2, h);
            const x0 = cx - barW / 2;
            const yTop = y(d.value);
            // Rounded data-end, square baseline.
            const path = `M ${x0} ${y(0)} V ${yTop + r} Q ${x0} ${yTop} ${x0 + r} ${yTop} H ${x0 + barW - r} Q ${x0 + barW} ${yTop} ${x0 + barW} ${yTop + r} V ${y(0)} Z`;
            return (
              <g key={d.label}>
                {/* Hit target taller than the bar for easier hovering. */}
                <rect x={cx - slot / 2} y={PAD.top} width={slot} height={plotH} fill="transparent">
                  <title>{`${d.label}: ${d.value}`}</title>
                </rect>
                {h > 0 && <path d={path} fill={color} className="ops-chart-mark" pointerEvents="none" />}
                <text x={cx} y={H - PAD.bottom + 16} textAnchor="middle" className="ops-chart-axis">
                  {short(d.label)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </figure>
  );
}
