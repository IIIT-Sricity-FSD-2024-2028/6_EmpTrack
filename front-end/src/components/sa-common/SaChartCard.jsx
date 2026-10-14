import ChartCanvas from './ChartCanvas';

/**
 * The original .chart-card: title with a colored icon, and a canvas that shows
 * a spinner skeleton until loaded is true. config: Chart.js config (or null when
 * the data failed to load, which leaves the card empty like the original).
 */
export default function SaChartCard({ id, title, icon, color, config, loaded, height, wide }) {
  return (
    <div className="card chart-card" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <h3 className="chart-title"><i className={`ph-fill ${icon}`} style={{ color }}></i> {title}</h3>
      <div className="chart-wrapper" style={height ? { height } : undefined}>
        {!loaded && <div className="chart-skel"><div className="spinner"></div></div>}
        <ChartCanvas id={id} config={config} />
      </div>
    </div>
  );
}
