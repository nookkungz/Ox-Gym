// Form field wrapper — uppercase caption label + optional hint around any control.
export function Field({ label, hint, children, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <div
          className="ox-cap"
          style={{ color: 'var(--ox-muted)', marginBottom: 6, fontSize: 9 }}
        >
          {label}
        </div>
      )}
      {children}
      {hint && (
        <div className="ox-thai" style={{ fontSize: 10, color: 'var(--ox-dim)', marginTop: 4 }}>
          {hint}
        </div>
      )}
    </div>
  )
}
