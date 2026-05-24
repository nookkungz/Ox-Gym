// Screen 11 — Monthly Training Schedule Planner.
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import BottomNav from '../components/BottomNav'
import { Loader, ErrorState, BusyOverlay } from '../components/Feedback'
import { useDialog } from '../components/Dialog'
import { todayISO, beYear, THAI_MONTHS, EN_DOWS } from '../lib/thai'

const ROUTINES = [
  { value: '', label: 'OPEN' },
  { value: 'Rest Day (วันพักผ่อน)', label: 'Rest Day (วันพักผ่อน)' },
  { value: 'Chest & Arms (อก + แขน)', label: 'Chest & Arms (อก + แขน)' },
  { value: 'Back & Arms (หลัง + แขน)', label: 'Back & Arms (หลัง + แขน)' },
  { value: 'Shoulders & Arms (ไหล่ + แขน)', label: 'Shoulders & Arms (ไหล่ + แขน)' },
  { value: 'Legs & Abs (ขา + หน้าท้อง)', label: 'Legs & Abs (ขา + หน้าท้อง)' },
  { value: 'Upper Body (ร่างกายส่วนบน)', label: 'Upper Body (ร่างกายส่วนบน)' },
  { value: 'Lower Body (ร่างกายส่วนล่าง)', label: 'Lower Body (ร่างกายส่วนล่าง)' },
  { value: 'Full Body (ทั่วร่าง)', label: 'Full Body (ทั่วร่าง)' },
  { value: 'Push Day (อก/ไหล่/หลังแขน)', label: 'Push Day (อก/ไหล่/หลังแขน)' },
  { value: 'Pull Day (หลัง/ไหล่หลัง/หน้าแขน)', label: 'Pull Day (หลัง/ไหล่หลัง/หน้าแขน)' },
  { value: 'Cardio & Core (คาดิโอ + แกนกลาง)', label: 'Cardio & Core (คาดิโอ + แกนกลาง)' },
]

const pad2 = (n) => String(n).padStart(2, '0')

export default function Planner() {
  const { coachId } = useApp()
  const navigate = useNavigate()
  const dialog = useDialog()

  const [view, setView] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload, setData } = useLoad(async () => {
    if (!coachId) return null
    const datePlans = await api.getSharedPlan()
    return { datePlans }
  }, [coachId])

  if (!coachId) return <Navigate to="/" replace />
  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />

  const datePlans = data?.datePlans || {}
  const today = todayISO()

  // Generate days in the selected month
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const daysList = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(view.y, view.m, d)
    const dow = dateObj.getDay()
    const iso = `${view.y}-${pad2(view.m + 1)}-${pad2(d)}`
    daysList.push({ d, dow, iso })
  }

  // Calculate statistics for the month
  let bookedCount = 0
  let restCount = 0
  let openCount = 0

  daysList.forEach((day) => {
    const val = datePlans[day.iso] || ''
    if (!val.trim()) {
      openCount++
    } else if (val.includes('Rest') || val.includes('พัก')) {
      restCount++
    } else {
      bookedCount++
    }
  })

  const shift = (delta) => {
    setView((v) => {
      const m = v.m + delta
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }
    })
  }

  const handleSelect = async (isoDate, value) => {
    // Optimistic UI update
    const updated = { ...datePlans, [isoDate]: value }
    setData({ datePlans: updated })

    try {
      await api.updateSharedPlan(updated)
    } catch (err) {
      await dialog.alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message)
      reload()
    }
  }

  return (
    <div className="ox-screen">
      {/* Premium Header similar to image schedule layout */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--ox-bg)',
          borderBottom: '1px solid var(--ox-line)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Back button */}
          <button
            onClick={() => navigate('/clients')}
            className="ox-tap"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3 L5 8 L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
          </button>

          {/* Title & Month Stats Summary */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ox-cap" style={{ color: 'var(--ox-red)', fontSize: 9, marginBottom: 2 }}>
              TRAINING PLANNER · แผนฝึกซ้อม
            </div>
            <div
              className="ox-thai ox-trunc"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--ox-fg)',
              }}
            >
              {THAI_MONTHS[view.m]} {beYear(view.y)}
            </div>
            <div
              className="ox-cap ox-trunc"
              style={{
                color: 'var(--ox-muted)',
                marginTop: 3,
                fontSize: 8,
                letterSpacing: '0.05em',
              }}
            >
              {pad2(bookedCount)} PLANNED · {pad2(restCount)} REST · {pad2(openCount)} OPEN
            </div>
          </div>

          {/* Month shift selectors */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {[['‹', -1], ['›', 1]].map(([label, d]) => (
              <button
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
                  background: 'transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date slot rows similar to image */}
      <div className="ox-body ox-scroll" style={{ paddingBottom: 96 }}>
        {daysList.map((day) => {
          const value = datePlans[day.iso] || ''
          const isToday = day.iso === today
          const dowName = EN_DOWS[day.dow]
          const isWeekend = day.dow === 0 || day.dow === 6

          return (
            <div
              key={day.iso}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid var(--ox-line)',
                minHeight: 56,
              }}
            >
              {/* Day label details (matching image schedule slot style) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  className="ox-mono"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isToday ? 'var(--ox-red)' : 'var(--ox-fg)',
                  }}
                >
                  {pad2(day.d)}
                </span>
                <span
                  className="ox-cap"
                  style={{
                    fontSize: 8,
                    color: isToday ? 'var(--ox-red)' : isWeekend ? 'var(--ox-muted)' : 'var(--ox-dim)',
                    fontWeight: 700,
                  }}
                >
                  {isToday ? 'TODAY' : dowName}
                </span>
              </div>

              {/* Direct selection routine dropdown (matching image style) */}
              <div style={{ position: 'relative' }}>
                <select
                  value={value}
                  onChange={(e) => handleSelect(day.iso, e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: value ? (value.includes('Rest') || value.includes('พัก') ? 'var(--ox-dim)' : 'var(--ox-fg)') : 'var(--ox-faint)',
                    fontFamily: 'var(--f-body)',
                    fontSize: 13,
                    fontWeight: value ? 700 : 500,
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    direction: 'rtl',
                    outline: 'none',
                    cursor: 'pointer',
                    paddingRight: 0,
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                  }}
                >
                  {ROUTINES.map((r) => (
                    <option
                      key={r.value}
                      value={r.value}
                      style={{
                        background: 'var(--ox-surface)',
                        color: 'var(--ox-fg)',
                        direction: 'ltr',
                      }}
                    >
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav active="plan" />
      {busy && <BusyOverlay />}
    </div>
  )
}
