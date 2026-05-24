// Screen 09 — Monthly calendar overview.
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import {
  todayISO, toISO, beYear, EN_MONTHS, THAI_MONTHS, THAI_DOWS,
} from '../lib/thai'
import Stat from '../components/Stat'
import BottomNav from '../components/BottomNav'
import { Loader, ErrorState } from '../components/Feedback'

const pad2 = (n) => String(n).padStart(2, '0')
const DAY_SLOTS = 15 // hourly rows 08:00–22:00

export default function Calendar() {
  const { coachId } = useApp()
  const navigate = useNavigate()

  const { data, loading, error, reload } = useLoad(async () => {
    if (!coachId) return null
    return { appts: await api.listAppointments(coachId) }
  }, [coachId])

  const [view, setView] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  if (!coachId) return <Navigate to="/" replace />
  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />

  const { appts } = data
  const today = todayISO()

  const countByDate = {}
  for (const a of appts) countByDate[a.date] = (countByDate[a.date] || 0) + 1

  const firstDow = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const monthPrefix = `${view.y}-${pad2(view.m + 1)}`

  const monthBooked = appts.filter((a) => (a.date || '').startsWith(monthPrefix)).length
  const todayCount = countByDate[today] || 0
  const openToday = Math.max(0, DAY_SLOTS - todayCount)

  const shift = (delta) => {
    setView((v) => {
      const m = v.m + delta
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
    })
  }

  const todayAppts = appts
    .filter((a) => a.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  return (
    <div className="ox-screen">
      {/* header */}
      <div style={{ padding: '18px 18px 8px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <div className="ox-cap" style={{ color: 'var(--ox-red)', marginBottom: 4 }}>
              SCHEDULE · ตารางนัด
            </div>
            <div className="ox-display" style={{ fontSize: 32 }}>
              <span style={{ color: 'var(--ox-fg)' }}>{EN_MONTHS[view.m]}</span>{' '}
              <span style={{ color: 'var(--ox-dim)' }}>{String(view.y).slice(-2)}</span>
            </div>
            <div className="ox-thai" style={{ color: 'var(--ox-muted)', marginTop: 2, fontSize: 12 }}>
              {THAI_MONTHS[view.m]} {beYear(view.y)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['‹', -1], ['›', 1]].map(([label, d]) => (
              <div
                key={label}
                className="ox-tap"
                onClick={() => shift(d)}
                style={{
                  width: 30,
                  height: 30,
                  border: '1px solid var(--ox-line)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ox-fg)',
                  fontSize: 16,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 14,
            padding: '12px 14px',
            background: 'var(--ox-surface)',
            border: '1px solid var(--ox-line)',
            borderRadius: 6,
          }}
        >
          <Stat label="THIS MONTH" value={pad2(monthBooked)} unit="นัด" />
          <div style={{ width: 1, background: 'var(--ox-line)' }} />
          <Stat label="TODAY" value={pad2(todayCount)} accent="var(--ox-red)" />
          <div style={{ width: 1, background: 'var(--ox-line)' }} />
          <Stat label="OPEN" value={pad2(openToday)} unit="ว่าง" accent="var(--ox-active)" />
        </div>
      </div>

      {/* days of week */}
      <div style={{ padding: '8px 14px 0', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {THAI_DOWS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '6px 0' }}>
              <div
                className="ox-thai"
                style={{
                  fontSize: 10,
                  color: i === 0 || i === 6 ? 'var(--ox-red)' : 'var(--ox-dim)',
                  fontWeight: 600,
                }}
              >
                {d}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* grid */}
      <div style={{ padding: '0 14px 8px', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />
            const iso = `${monthPrefix}-${pad2(d)}`
            const isToday = iso === today
            const dow = i % 7
            const isWeekend = dow === 0 || dow === 6
            const count = countByDate[iso] || 0
            return (
              <div
                key={d}
                className="ox-tap"
                onClick={() => navigate(`/calendar/${iso}`)}
                style={{
                  aspectRatio: '1/1',
                  background: isToday ? 'var(--ox-red)' : 'transparent',
                  border: `1px solid ${!isToday && count ? 'var(--ox-line)' : 'transparent'}`,
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                <span
                  className="ox-mono"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isToday
                      ? '#fff'
                      : isWeekend
                        ? 'var(--ox-muted)'
                        : 'var(--ox-fg)',
                  }}
                >
                  {d}
                </span>
                {count > 0 && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                    {Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                      <div
                        key={di}
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          background: isToday ? '#fff' : 'var(--ox-active)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* today preview */}
      <div className="ox-body ox-scroll" style={{ padding: '8px 18px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
            marginBottom: 6,
          }}
        >
          <span className="ox-cap" style={{ color: 'var(--ox-muted)' }}>
            TODAY · วันนี้
          </span>
          <span
            className="ox-cap ox-tap"
            style={{ color: 'var(--ox-red)' }}
            onClick={() => navigate(`/calendar/${today}`)}
          >
            VIEW DAY ›
          </span>
        </div>
        {todayAppts.length === 0 ? (
          <div
            className="ox-thai"
            style={{ fontSize: 12, color: 'var(--ox-dim)', padding: '10px 0' }}
          >
            วันนี้ยังไม่มีนัดหมาย
          </div>
        ) : (
          todayAppts.map((a, i) => (
            <div
              key={a.id}
              className="ox-tap"
              onClick={() => navigate(`/calendar/${today}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom:
                  i < todayAppts.length - 1 ? '1px solid var(--ox-line)' : 'none',
              }}
            >
              <span
                className="ox-mono"
                style={{ fontSize: 14, fontWeight: 700, color: 'var(--ox-fg)', width: 50 }}
              >
                {a.time}
              </span>
              <div style={{ width: 2, height: 28, background: 'var(--ox-red)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ox-thai" style={{ fontSize: 13, fontWeight: 600 }}>
                  {a.clientName}
                </div>
                {a.label && (
                  <div
                    className="ox-thai ox-trunc"
                    style={{
                      fontSize: 11,
                      color: 'var(--ox-muted)',
                    }}
                  >
                    {a.label}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav active="calendar" />
    </div>
  )
}
