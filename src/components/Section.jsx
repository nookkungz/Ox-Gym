export default function Section({ title, action, children, padded = true, style }) {
  return (
    <div style={{ padding: padded ? '0 18px' : 0, marginBottom: 18, ...style }}>
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div className="ox-cap" style={{ color: 'var(--ox-muted)' }}>
            {title}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
