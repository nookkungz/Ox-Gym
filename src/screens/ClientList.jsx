// Screen 02 — Trainee roster for the signed-in coach.
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { todayISO, relativeLabel } from '../lib/thai'
import Avatar from '../components/Avatar'
import Stat from '../components/Stat'
import Fab from '../components/Fab'
import BottomNav from '../components/BottomNav'
import TraineeSheet from '../components/TraineeSheet'
import { Loader, ErrorState, BusyOverlay, EmptyState } from '../components/Feedback'
import { useDialog } from '../components/Dialog'
import { IconSearch } from '../components/Icons'
import Button from '../components/Button'

const pad2 = (n) => String(n).padStart(2, '0')
const statusOf = (t) => t.status || 'active'

export default function ClientList() {
  const { coachId } = useApp()
  const navigate = useNavigate()
  const dialog = useDialog()

  const { data, loading, error, reload, setData } = useLoad(async () => {
    if (!coachId) return null
    const [coach, trainees, appts, sharedPlan] = await Promise.all([
      api.getCoach(coachId),
      api.listTrainees(coachId),
      api.listAppointments(coachId),
      api.getSharedPlan(),
    ])
    return { coach, trainees, appts, sharedPlan }
  }, [coachId])

  const [tab, setTab] = useState('ALL')
  const [search, setSearch] = useState(null) // null = closed
  const [sheet, setSheet] = useState(null) // { mode, trainee }
  const [busy, setBusy] = useState(false)

  if (!coachId) return <Navigate to="/" replace />
  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (!data.coach) return <Navigate to="/" replace />

  const { coach, trainees, appts, sharedPlan } = data
  const today = todayISO()
  const todayPlan = sharedPlan?.[today] || ''
  const todayAppts = appts
    .filter((a) => a.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const activeAll = trainees.filter((t) => statusOf(t) === 'active')
  const pausedAll = trainees.filter((t) => statusOf(t) === 'paused')
  const todayCount = todayAppts.length

  const q = (search || '').trim().toLowerCase()
  const matches = (t) =>
    !q ||
    (t.name || '').toLowerCase().includes(q) ||
    (t.romanized || '').toLowerCase().includes(q) ||
    (t.goal || '').toLowerCase().includes(q)

  const shown = trainees.filter(matches)
  const shownActive = shown.filter((t) => statusOf(t) === 'active')
  const shownPaused = shown.filter((t) => statusOf(t) === 'paused')
  const tabActive = tab !== 'PAUSED'
  const tabPaused = tab !== 'ACTIVE'
  const visibleCount =
    (tabActive ? shownActive.length : 0) + (tabPaused ? shownPaused.length : 0)

  const toggleStatus = (t) => {
    const next = statusOf(t) === 'active' ? 'paused' : 'active'
    setData({
      ...data,
      trainees: trainees.map((x) => (x.id === t.id ? { ...x, status: next } : x)),
    })
    api.updateTrainee(t.id, { status: next }).catch(async () => {
      await dialog.alert('อัปเดตสถานะไม่สำเร็จ')
      reload()
    })
  }

  const saveTrainee = async (form) => {
    setBusy(true)
    try {
      if (sheet.mode === 'edit') await api.updateTrainee(sheet.trainee.id, form)
      else await api.createTrainee(coachId, form)
      setSheet(null)
      reload()
    } catch (e) {
      await dialog.alert('บันทึกไม่สำเร็จ: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const removeTrainee = async (t) => {
    const ok = await dialog.confirm(
      `ลบลูกเทรน "${t.name}" ?\nการลบนี้ไม่สามารถย้อนกลับได้`,
      { title: 'ลบลูกเทรน', confirmLabel: 'ลบ', danger: true },
    )
    if (!ok) return
    setBusy(true)
    try {
      await api.deleteTrainee(t.id)
      setSheet(null)
      reload()
    } catch (e) {
      await dialog.alert('ลบไม่สำเร็จ: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const TABS = [
    { id: 'ALL', label: 'ALL', count: trainees.length },
    { id: 'ACTIVE', label: 'ACTIVE', count: activeAll.length },
    { id: 'PAUSED', label: 'PAUSED', count: pausedAll.length },
  ]

  return (
    <div className="ox-screen">
     <div className="ox-body ox-scroll">
      {/* header */}
      <div style={{ padding: '18px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            className="ox-tap"
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Avatar name={coach.name} romanized={coach.romanized} photo={coach.photo || null} size={32} active />
            <div>
              <div className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 8 }}>
                SIGNED IN · เปลี่ยนโค้ช
              </div>
              <div className="ox-thai" style={{ fontSize: 13, fontWeight: 600 }}>
                {coach.name}
              </div>
            </div>
          </div>
          <button
            className="ox-tap"
            onClick={() => setSearch((s) => (s === null ? '' : null))}
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              border: `1px solid ${search !== null ? 'var(--ox-red)' : 'var(--ox-line)'}`,
              background: search !== null ? 'var(--ox-elev)' : 'transparent',
              color: search !== null ? 'var(--ox-red)' : 'var(--ox-fg-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Search"
          >
            <IconSearch size={14} />
          </button>
        </div>

        {search !== null && (
          <input
            className="ox-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือเป้าหมาย..."
            autoFocus
            style={{ marginTop: 12 }}
          />
        )}

        <div style={{ marginTop: 16 }}>
          <div className="ox-cap" style={{ color: 'var(--ox-red)', marginBottom: 4 }}>
            TRAINEES
          </div>
          <div className="ox-display" style={{ fontSize: 34, color: 'var(--ox-fg)' }}>
            ลูกเทรนของฉัน
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
            <Stat label="ACTIVE" value={pad2(activeAll.length)} accent="var(--ox-fg)" />
            <Stat label="PAUSED" value={pad2(pausedAll.length)} accent="var(--ox-dim)" />
            <Stat label="TODAY" value={pad2(todayCount)} unit="นัด" accent="var(--ox-red)" />
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div style={{ padding: '0 18px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(28,28,28,0.95) 100%)',
          border: '1px solid var(--ox-line)',
          borderRadius: 'var(--r-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {/* Block 1: Coach's own training plan */}
          <div
            className="ox-tap"
            onClick={() => navigate('/plan')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 2px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="ox-pulse" style={{ background: 'var(--ox-red)', boxShadow: '0 0 0 0 var(--ox-red-glow)' }} />
                <span className="ox-cap" style={{ color: 'var(--ox-red)', fontSize: 9, letterSpacing: '0.12em' }}>
                  MY TRAINING TODAY · แผนฝึกซ้อมของคุณวันนี้
                </span>
              </div>
              <span className="ox-thai" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ox-fg)' }}>
                {todayPlan || 'OPEN (วันอิสระ)'}
              </span>
            </div>
            <span className="ox-cap" style={{ color: 'var(--ox-dim)', fontSize: 9 }}>
              แก้ไข ›
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--ox-line)' }} />

          {/* Block 2: Scheduled appointments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              className="ox-tap"
              onClick={() => navigate(`/calendar/${today}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span className="ox-cap" style={{ color: 'var(--ox-muted)', fontSize: 9, letterSpacing: '0.12em' }}>
                TODAY'S APPOINTMENTS · นัดหมายวันนี้
              </span>
              <span className="ox-cap" style={{ color: 'var(--ox-red)', fontSize: 9 }}>
                ดูตารางนัด ›
              </span>
            </div>

            {todayAppts.length === 0 ? (
              <div
                className="ox-thai"
                style={{
                  fontSize: 13,
                  color: 'var(--ox-dim)',
                  padding: '10px 2px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: 'var(--r-sm)',
                  border: '1px dashed var(--ox-line)',
                }}
              >
                ไม่มีนัดหมายวันนี้
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="ox-tap"
                    onClick={() => appt.traineeId ? navigate(`/client/${appt.traineeId}`) : navigate(`/calendar/${today}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--ox-line)',
                      borderRadius: 'var(--r-sm)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      className="ox-mono"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--ox-red)',
                        width: 44,
                      }}
                    >
                      {appt.time}
                    </span>
                    <div style={{ width: 1, height: 18, background: 'var(--ox-line)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ox-thai" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ox-fg)' }}>
                        {appt.clientName}
                      </div>
                      {(appt.routine || appt.label) && (
                        <div className="ox-thai ox-trunc" style={{ fontSize: 11, color: 'var(--ox-muted)' }}>
                          {[appt.routine, appt.label].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ padding: '0 18px', marginTop: 12 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ox-line)' }}>
          {TABS.map((t) => {
            const on = t.id === tab
            return (
              <div
                key={t.id}
                className="ox-tap"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 14px',
                  borderBottom: `2px solid ${on ? 'var(--ox-red)' : 'transparent'}`,
                  marginBottom: -1,
                  color: on ? 'var(--ox-fg)' : 'var(--ox-dim)',
                }}
              >
                <span className="ox-cap" style={{ color: 'inherit' }}>
                  {t.label}
                </span>
                <span
                  className="ox-mono"
                  style={{ marginLeft: 6, fontSize: 10, color: 'var(--ox-dim)' }}
                >
                  {t.count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* list */}
      <div style={{ padding: '4px 18px 96px' }}>
        {trainees.length === 0 ? (
          <EmptyState
            icon="👥"
            title="ยังไม่มีลูกเทรน"
            hint="เริ่มต้นด้วยการเพิ่มลูกเทรนคนแรกของคุณ"
            action={
              <Button size="sm" onClick={() => setSheet({ mode: 'new' })}>
                + เพิ่มลูกเทรน
              </Button>
            }
          />
        ) : visibleCount === 0 ? (
          <EmptyState icon="🔍" title="ไม่พบลูกเทรน" hint="ลองเปลี่ยนคำค้นหาหรือแท็บ" />
        ) : (
          <>
            {tabActive &&
              shownActive.map((t) => (
                <ClientRow
                  key={t.id}
                  t={t}
                  onOpen={() => navigate(`/client/${t.id}`)}
                  onToggle={() => toggleStatus(t)}
                />
              ))}
            {tab === 'ALL' && shownPaused.length > 0 && (
              <div
                className="ox-cap"
                style={{
                  color: 'var(--ox-dim)',
                  padding: '14px 2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>PAUSED · พักการเทรน</span>
                <div style={{ flex: 1, height: 1, background: 'var(--ox-line)' }} />
              </div>
            )}
            {tabPaused &&
              shownPaused.map((t) => (
                <ClientRow
                  key={t.id}
                  t={t}
                  onOpen={() => navigate(`/client/${t.id}`)}
                  onToggle={() => toggleStatus(t)}
                />
              ))}
          </>
        )}
      </div>
     </div>

      <Fab label="NEW TRAINEE" onClick={() => setSheet({ mode: 'new' })} />
      <BottomNav active="clients" />

      {sheet && (
        <TraineeSheet
          mode={sheet.mode}
          trainee={sheet.trainee}
          onClose={() => setSheet(null)}
          onSave={saveTrainee}
          onDelete={removeTrainee}
        />
      )}
      {busy && <BusyOverlay />}
    </div>
  )
}

function ClientRow({ t, onOpen, onToggle }) {
  const paused = statusOf(t) === 'paused'
  const sessions = t.sessionCount || 0
  const last = relativeLabel(t.lastWorkoutDate)
  return (
    <div
      className="ox-tap"
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 4px',
        borderBottom: '1px solid var(--ox-line)',
        opacity: paused ? 0.55 : 1,
        filter: paused ? 'grayscale(0.6)' : 'none',
      }}
    >
      <Avatar name={t.name} romanized={t.romanized} photo={t.photo || null} size={42} paused={paused} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="ox-thai ox-trunc"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--ox-fg)',
            }}
          >
            {t.name}
          </span>
          {t.age && (
            <span className="ox-mono" style={{ fontSize: 10, color: 'var(--ox-dim)', flexShrink: 0 }}>
              · {t.age}
            </span>
          )}
        </div>
        <div
          className="ox-thai ox-trunc"
          style={{
            fontSize: 12,
            color: 'var(--ox-muted)',
          }}
        >
          {t.goal || 'ยังไม่ได้ระบุเป้าหมาย'}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          className="ox-mono"
          style={{ fontSize: 11, fontWeight: 700, color: paused ? 'var(--ox-dim)' : 'var(--ox-fg)' }}
        >
          {sessions}
          <span style={{ color: 'var(--ox-dim)', fontWeight: 400 }}>×</span>
        </div>
        <div
          className="ox-cap"
          style={{
            fontSize: 8,
            color: last === 'TODAY' ? 'var(--ox-active)' : 'var(--ox-dim)',
          }}
        >
          {last}
        </div>
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        style={{
          width: 26,
          height: 14,
          borderRadius: 7,
          background: paused ? 'var(--ox-elev-2)' : 'var(--ox-red)',
          position: 'relative',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 1,
            left: paused ? 1 : 13,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s ease',
          }}
        />
      </div>
    </div>
  )
}
