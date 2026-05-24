// Screen 10 — Daily appointment schedule.
import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { todayISO, enDateLabel, thaiDateFull } from '../lib/thai'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import { Sheet } from '../components/Modal'
import { Field } from '../components/Field'
import BottomNav from '../components/BottomNav'
import { Loader, ErrorState, BusyOverlay } from '../components/Feedback'
import { useDialog } from '../components/Dialog'
import { ROUTINES } from '../lib/routines'

const pad2 = (n) => String(n).padStart(2, '0')
const SLOTS = Array.from({ length: 15 }, (_, i) => `${pad2(i + 8)}:00`) // 08:00–22:00

export default function Appointments() {
  const { date } = useParams()
  const { coachId } = useApp()
  const navigate = useNavigate()
  const dialog = useDialog()

  const { data, loading, error, reload } = useLoad(async () => {
    if (!coachId) return null
    const [appts, trainees] = await Promise.all([
      api.listAppointments(coachId),
      api.listTrainees(coachId),
    ])
    return { dayAppts: appts.filter((a) => a.date === date), trainees }
  }, [coachId, date])

  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!coachId) return <Navigate to="/" replace />
  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />

  const { dayAppts, trainees } = data
  const byTime = {}
  for (const a of dayAppts) byTime[a.time] = a
  const takenTimes = dayAppts.map((a) => a.time)
  const isToday = date === todayISO()
  const nowSlot = `${pad2(new Date().getHours())}:00`

  const saveAppt = async (form) => {
    setBusy(true)
    try {
      await api.createAppointment(coachId, form)
      setAdding(false)
      reload()
    } catch (e) {
      await dialog.alert('บันทึกนัดไม่สำเร็จ: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const removeAppt = async (a) => {
    const ok = await dialog.confirm(`ลบนัด ${a.time} · ${a.clientName}?`, {
      title: 'ลบนัดหมาย',
      confirmLabel: 'ลบ',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteAppointment(a.id)
      reload()
    } catch (e) {
      await dialog.alert('ลบไม่สำเร็จ: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const full = takenTimes.length >= SLOTS.length

  return (
    <div className="ox-screen">
      <Header
        onBack={() => navigate('/calendar')}
        kicker={enDateLabel(date)}
        title={thaiDateFull(date)}
        subtitle={`${pad2(dayAppts.length)} BOOKED · ${pad2(SLOTS.length - dayAppts.length)} OPEN · 08:00–22:00`}
        right={
          <button
            className="ox-tap"
            onClick={() => !full && setAdding(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: full ? 'var(--ox-elev)' : 'var(--ox-red)',
              border: 'none',
              color: full ? 'var(--ox-dim)' : '#fff',
              fontSize: 18,
              fontWeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Add appointment"
          >
            +
          </button>
        }
      />

      <div className="ox-body ox-scroll" style={{ padding: '12px 18px 24px' }}>
        {SLOTS.map((time, i) => {
          const appt = byTime[time]
          const isNow = isToday && time === nowSlot
          return (
            <div
              key={time}
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr',
                minHeight: appt ? 58 : 38,
                borderBottom: i < SLOTS.length - 1 ? '1px solid var(--ox-line)' : 'none',
                alignItems: 'stretch',
              }}
            >
              <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
                <span
                  className="ox-mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isNow
                      ? 'var(--ox-red)'
                      : appt
                        ? 'var(--ox-fg)'
                        : 'var(--ox-dim)',
                  }}
                >
                  {time}
                </span>
                {isNow && (
                  <span
                    className="ox-cap"
                    style={{ color: 'var(--ox-red)', fontSize: 7, marginTop: 2 }}
                  >
                    NOW
                  </span>
                )}
              </div>
              {appt ? (
                <div
                  style={{
                    background: isNow ? 'var(--ox-red)' : 'var(--ox-surface)',
                    borderLeft: isNow ? 'none' : '3px solid var(--ox-red)',
                    padding: '10px 12px',
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Avatar name={appt.clientName} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="ox-thai ox-trunc"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isNow ? '#fff' : 'var(--ox-fg)',
                      }}
                    >
                      {appt.clientName}
                    </div>
                    {(appt.routine || appt.label) && (
                      <div
                        className="ox-thai ox-trunc"
                        style={{
                          fontSize: 11,
                          color: isNow ? 'rgba(255,255,255,0.78)' : 'var(--ox-muted)',
                        }}
                      >
                        {[appt.routine, appt.label].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <button
                    className="ox-tap"
                    onClick={() => removeAppt(appt)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: isNow ? 'rgba(255,255,255,0.6)' : 'var(--ox-dim)',
                      fontSize: 16,
                      padding: 4,
                    }}
                    aria-label="Delete appointment"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  className="ox-tap"
                  onClick={() => setAdding(time)}
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}
                >
                  <span className="ox-cap" style={{ color: 'var(--ox-faint)' }}>
                    OPEN
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav active="calendar" />

      {adding && (
        <AppointmentSheet
          date={date}
          trainees={trainees}
          takenTimes={takenTimes}
          presetTime={typeof adding === 'string' ? adding : null}
          onClose={() => setAdding(false)}
          onSave={saveAppt}
        />
      )}
      {busy && <BusyOverlay />}
    </div>
  )
}

function AppointmentSheet({ date, trainees, takenTimes, presetTime, onClose, onSave }) {
  const free = SLOTS.filter((s) => !takenTimes.includes(s))
  const [time, setTime] = useState(
    presetTime && free.includes(presetTime) ? presetTime : free[0] || SLOTS[0],
  )
  const [who, setWho] = useState(trainees[0]?.id || 'custom')
  const [customName, setCustomName] = useState('')
  const [routine, setRoutine] = useState('')
  const [label, setLabel] = useState('')

  const isCustom = who === 'custom'

  const submit = (e) => {
    e.preventDefault()
    const trainee = trainees.find((t) => t.id === who)
    const clientName = trainee ? trainee.name : customName.trim()
    if (!clientName || !time) return
    onSave({
      date,
      time,
      traineeId: trainee ? trainee.id : null,
      clientName,
      routine,
      label: label.trim(),
    })
  }

  return (
    <Sheet open title="เพิ่มนัดหมาย" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="ช่วงเวลา">
          <select
            className="ox-field"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{ colorScheme: 'dark' }}
          >
            {free.map((s) => (
              <option key={s} value={s}>
                {s} – {pad2(parseInt(s) + 1)}:00
              </option>
            ))}
          </select>
        </Field>
        <Field label="ลูกเทรน / ผู้เข้าพบ">
          <select
            className="ox-field"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            style={{ colorScheme: 'dark' }}
          >
            {trainees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value="custom">ระบุชื่อเอง...</option>
          </select>
        </Field>
        {isCustom && (
          <Field label="ชื่อผู้เข้าพบ">
            <input
              className="ox-field"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="ชื่อ"
              autoFocus
            />
          </Field>
        )}
        <Field label="กลุ่มกล้ามเนื้อ / ส่วนที่เทรน">
          <select
            className="ox-field"
            value={routine}
            onChange={(e) => setRoutine(e.target.value)}
            style={{ colorScheme: 'dark' }}
          >
            {ROUTINES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="รายละเอียด (ไม่บังคับ)">
          <input
            className="ox-field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="เช่น Push day, ออนไลน์, วัดสัดส่วน"
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          full
          disabled={!time || (isCustom && !customName.trim())}
          style={{ marginTop: 6 }}
        >
          บันทึกนัดหมาย
        </Button>
      </form>
    </Sheet>
  )
}
