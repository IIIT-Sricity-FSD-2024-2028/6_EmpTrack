import { useEffect, useRef } from 'react';

/**
 * <canvas> drawn with window.Chart (load it first with saCommon.loadChartJs).
 * config: a Chart.js config; the chart is rebuilt whenever it changes and
 * nothing is drawn while it is empty.
 */
export default function ChartCanvas({ id, config }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!config || typeof window.Chart === 'undefined' || !canvasRef.current) return undefined;
    const chart = new window.Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [config]);

  return <canvas id={id} ref={canvasRef}></canvas>;
}
