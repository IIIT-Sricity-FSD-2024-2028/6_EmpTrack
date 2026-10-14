/**
 * A profile info card ("Personal Information", "Work Information"...) in the
 * original profile-page layout.
 * fields: [{ label, value, icon? }] — with an icon (Phosphor fill class, e.g.
 *         'ph-envelope-simple') the row shows icon + label + value; without,
 *         label above a bold value.
 */
export default function ProfileSection({ title, fields = [], children }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 className="profile-section-title">{title}</h3>
      {fields.length > 0 && (
        <div className="profile-section-list">
          {fields.map(({ label, value, icon }) => (
            <div key={label} className={`profile-section-row${icon ? ' has-icon' : ''}`}>
              {icon && (
                <div className="profile-section-icon">
                  <i className={`ph-fill ${icon}`}></i>
                </div>
              )}
              <div>
                <div className="profile-section-label">{label}</div>
                <div className="profile-section-value">{value ?? '--'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
