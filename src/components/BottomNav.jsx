import { useNavigate } from 'react-router-dom'

const TABS = [
  {
    id: 'clients', label: 'TRAINEES',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 16c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'calendar', label: 'SCHEDULE',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2.5" y="3.5" width="13" height="12" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 2v3M12 2v3M2.5 7.5h13" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'plan', label: 'PLAN',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3.5" y="4.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 3h6M5.5 7.5h7M5.5 10.5h7M5.5 13.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

// `active` highlights a tab; `clientId` routes LOG/PROGRESS into a trainee's context.
export default function BottomNav({ active = 'clients', clientId }) {
  const navigate = useNavigate()

  const go = (id) => {
    if (id === 'clients') navigate('/clients')
    else if (id === 'calendar') navigate('/calendar')
    else if (id === 'plan') navigate('/plan')
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--ox-line)',
        background: 'var(--ox-bg)',
        display: 'flex',
        padding: '6px 4px 14px',
        flexShrink: 0,
      }}
    >
      {TABS.map((t) => {
        const on = t.id === active
        return (
          <div
            key={t.id}
            className="ox-tap"
            onClick={() => go(t.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 0',
              color: on ? 'var(--ox-red)' : 'var(--ox-dim)',
              position: 'relative',
            }}
          >
            {on && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 18,
                  height: 2,
                  background: 'var(--ox-red)',
                }}
              />
            )}
            {t.icon}
            <span className="ox-cap" style={{ fontSize: 9, color: 'inherit' }}>
              {t.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
