export default function Header({ title, subtitle, kicker, onBack, right }) {
  return (
    <div
      style={{
        padding: '14px 18px',
        background: 'var(--ox-bg)',
        borderBottom: '1px solid var(--ox-line)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onBack && (
          <button
            onClick={onBack}
            className="ox-tap"
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              border: '1px solid var(--ox-line)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ox-fg-2)',
              flexShrink: 0,
            }}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
            </svg>
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {kicker && (
            <div
              className="ox-cap"
              style={{ color: 'var(--ox-red)', fontSize: 9, marginBottom: 3 }}
            >
              {kicker}
            </div>
          )}
          <div
            className="ox-thai ox-trunc"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ox-fg)',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              className="ox-cap ox-trunc"
              style={{
                color: 'var(--ox-muted)',
                marginTop: 4,
                fontSize: 9,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
    </div>
  )
}
