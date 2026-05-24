// Loading / empty / error states.
import Button from './Button'

export function Spinner({ size = 22, stroke = 2 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${stroke}px solid var(--ox-line-2)`,
        borderTopColor: 'var(--ox-red)',
        animation: 'ox-spin 0.7s linear infinite',
      }}
    />
  )
}

// Fills the whole screen frame.
export function Loader({ label = 'กำลังโหลดข้อมูล...' }) {
  return (
    <div className="ox-screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Spinner size={30} />
      <div className="ox-cap ox-thai" style={{ color: 'var(--ox-muted)', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  )
}

// Absolute overlay shown while an action is in flight.
export function BusyOverlay({ label = 'กำลังบันทึก...' }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: 'rgba(10,10,10,0.78)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <Spinner size={30} />
      <div className="ox-cap ox-thai" style={{ color: 'var(--ox-muted)' }}>
        {label}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 28px',
        textAlign: 'center',
        gap: 8,
      }}
    >
      {icon && (
        <div style={{ fontSize: 30, color: 'var(--ox-faint)', marginBottom: 4 }}>{icon}</div>
      )}
      <div className="ox-thai" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ox-fg-2)' }}>
        {title}
      </div>
      {hint && (
        <div className="ox-thai" style={{ fontSize: 12, color: 'var(--ox-dim)', maxWidth: 250 }}>
          {hint}
        </div>
      )}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      className="ox-screen"
      style={{ alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28, textAlign: 'center' }}
    >
      <div className="ox-cap" style={{ color: 'var(--ox-red)' }}>
        เกิดข้อผิดพลาด
      </div>
      <div className="ox-thai" style={{ fontSize: 13, color: 'var(--ox-muted)' }}>
        {message || 'โหลดข้อมูลไม่สำเร็จ'}
      </div>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          ลองใหม่
        </Button>
      )}
    </div>
  )
}
