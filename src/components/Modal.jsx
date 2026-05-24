// Overlay primitives — both anchor to the .ox-app frame (position: absolute).

// Centred dialog box.
export function Modal({ open, onClose, children, maxWidth = 360 }) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 120,
        background: 'rgba(0,0,0,0.74)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 22,
        animation: 'ox-fade-in 0.14s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ox-card"
        style={{
          width: '100%',
          maxWidth,
          borderColor: 'var(--ox-line-2)',
          animation: 'ox-rise 0.2s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Bottom sheet — used for create/edit forms.
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 120,
        background: 'rgba(0,0,0,0.74)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'ox-fade-in 0.14s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--ox-surface)',
          borderTop: '1px solid var(--ox-line-2)',
          borderRadius: '14px 14px 0 0',
          maxHeight: '92%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'ox-rise 0.22s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--ox-line)',
            flexShrink: 0,
          }}
        >
          <span className="ox-cap" style={{ color: 'var(--ox-fg)', fontSize: 11 }}>
            {title}
          </span>
          <button
            onClick={onClose}
            className="ox-tap"
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              border: '1px solid var(--ox-line)',
              background: 'transparent',
              color: 'var(--ox-muted)',
              fontSize: 17,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="ox-scroll" style={{ overflow: 'auto', padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
