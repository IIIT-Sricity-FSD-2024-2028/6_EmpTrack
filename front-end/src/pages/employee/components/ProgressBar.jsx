/** Thin horizontal progress bar (dashboard task cards, issue details). */
export default function ProgressBar({ value = 0, height = 6, radius = 4, color = 'var(--primary-color)' }) {
  return (
    <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: radius, overflow: 'hidden', height }}>
      <div style={{ width: `${value}%`, backgroundColor: color, height: '100%', transition: 'width 0.3s ease' }}></div>
    </div>
  );
}
