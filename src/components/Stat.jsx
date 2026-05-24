export default function Stat({ label, value, unit, accent, delta }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="ox-cap" style={{ color: 'var(--ox-muted)', fontSize: 9 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          className="ox-mono"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: accent || 'var(--ox-fg)',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 9 }}>
            {unit}
          </span>
        )}
        {delta && (
          <span
            className="ox-mono"
            style={{
              fontSize: 10,
              color: 'var(--ox-active)',
              marginLeft: 'auto',
              fontWeight: 600,
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}
