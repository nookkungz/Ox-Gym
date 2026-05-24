// Floating action button — anchored above the bottom nav within the app frame.
export default function Fab({ icon = '+', onClick, label, style }) {
  return (
    <button
      onClick={onClick}
      className="ox-tap"
      style={{
        position: 'absolute',
        bottom: 84,
        right: 18,
        background: 'var(--ox-red)',
        color: '#fff',
        width: label ? 'auto' : 56,
        height: 56,
        padding: label ? '0 20px' : 0,
        borderRadius: label ? 30 : 8,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'var(--f-body)',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        fontSize: 12,
        boxShadow: '0 8px 24px var(--ox-red-glow), 0 0 0 1px rgba(255,255,255,0.08)',
        zIndex: 20,
        ...style,
      }}
    >
      {typeof icon === 'string' ? (
        <span style={{ fontSize: 22, fontWeight: 400, lineHeight: 1 }}>{icon}</span>
      ) : (
        icon
      )}
      {label && <span>{label}</span>}
    </button>
  )
}
