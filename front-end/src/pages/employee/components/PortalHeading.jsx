/** Page heading with the "Employee Portal" caption (leave-request, notifications). */
export default function PortalHeading({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)' }}>{children}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 'normal' }}>Employee Portal</span>
      </div>
    </div>
  );
}
