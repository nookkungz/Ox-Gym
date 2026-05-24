// Screen 03 — Single trainee overview.
import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useLoad } from '../lib/useLoad'
import * as api from '../lib/api'
import { shortDate, enDateLabel } from '../lib/thai'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import Section from '../components/Section'
import Stat from '../components/Stat'
import BottomNav from '../components/BottomNav'
import TraineeSheet from '../components/TraineeSheet'
import { Loader, ErrorState, BusyOverlay } from '../components/Feedback'
import { useDialog } from '../components/Dialog'
import { IconEdit } from '../components/Icons'

const QUICK = [
  { key: 'log', glyph: '＋', l: 'LOG WORKOUT', s: 'บันทึกการเทรน', accent: true },
  { key: 'history', glyph: '≣', l: 'HISTORY', s: 'ประวัติการเทรน' },
  { key: 'measure', glyph: '⊟', l: 'MEASUREMENTS', s: 'วัดสัดส่วน' },
  { key: 'photos', glyph: '⬜', l: 'PROGRESS PHOTOS', s: 'รูปความคืบหน้า' },
]

function workoutKind(w) {
  return (w.exercises || []).some((e) => e.type === 'weight') ? 'weight' : 'cardio'
}
function workoutTitle(w) {
  if (w.note) return w.note
  const ex = w.exercises || []
  return ex.length ? `${ex.length} ท่าฝึก` : 'เซสชันว่าง'
}

export default function ClientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialog = useDialog()

  const { data, loading, error, reload } = useLoad(async () => {
    const [trainee, workouts, checkins] = await Promise.all([
      api.getTrainee(id),
      api.listWorkouts(id),
      api.listCheckins(id),
    ])
    return { trainee, workouts, checkins }
  }, [id])

  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) return <Loader />
  if (error) return <ErrorState message={error.message} onRetry={reload} />
  if (!data.trainee) return <Navigate to="/clients" replace />

  const { trainee, workouts, checkins } = data
  const paused = (trainee.status || 'active') === 'paused'
  const sessions = workouts.length
  const weeks = trainee.createdAt
    ? Math.max(1, Math.floor((Date.now() - trainee.createdAt) / (7 * 86400000)))
    : 0

  const goQuick = (key) => {
    if (key === 'log') navigate(`/client/${id}/workout/new`)
    else if (key === 'history') navigate(`/client/${id}/history`)
    else if (key === 'measure') navigate(`/client/${id}/measurements`)
    else if (key === 'photos') navigate(`/client/${id}/photos`)
  }

  const saveTrainee = async (form) => {
    setBusy(true)
    try {
      await api.updateTrainee(id, form)
      setEditing(false)
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
      await api.deleteTrainee(id)
      navigate('/clients', { replace: true })
    } catch (e) {
      await dialog.alert('ลบไม่สำเร็จ: ' + e.message)
      setBusy(false)
    }
  }

  return (
    <div className="ox-screen">
      <Header
        onBack={() => navigate('/clients')}
        kicker="TRAINEE PROFILE"
        title={trainee.name}
        subtitle={[
          trainee.romanized,
          trainee.age && `อายุ ${trainee.age}`,
          trainee.weight && `${trainee.weight} กก.`,
          trainee.height && `${trainee.height} ซม.`,
          trainee.phone,
        ]
          .filter(Boolean)
          .join(' · ')}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="ox-tap"
              onClick={() => setEditing(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: '1px solid var(--ox-line)',
                background: 'transparent',
                color: 'var(--ox-fg-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Edit trainee"
            >
              <IconEdit size={13} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {paused ? (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--ox-dim)',
                  }}
                />
              ) : (
                <div className="ox-pulse" />
              )}
              <span
                className="ox-cap"
                style={{ color: paused ? 'var(--ox-dim)' : 'var(--ox-active)' }}
              >
                {paused ? 'PAUSED' : 'ACTIVE'}
              </span>
            </div>
            {trainee.photo && (
              <Avatar
                name={trainee.name}
                romanized={trainee.romanized}
                photo={trainee.photo}
                size={32}
                paused={paused}
              />
            )}
          </div>
        }
      />

      <div className="ox-body ox-scroll" style={{ paddingTop: 16 }}>
        {/* Goal */}
        <Section>
          <div className="ox-card" style={{ padding: 14, borderLeft: '3px solid var(--ox-red)' }}>
            <div className="ox-cap" style={{ color: 'var(--ox-red)', marginBottom: 6 }}>
              GOAL · เป้าหมาย
            </div>
            <div
              className="ox-thai"
              style={{ fontSize: 15, fontWeight: 600, color: 'var(--ox-fg)', lineHeight: 1.35 }}
            >
              {trainee.goal || 'ยังไม่ได้ระบุเป้าหมายการฝึก'}
            </div>
          </div>
        </Section>

        {/* Stats */}
        <Section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              padding: 14,
              background: 'var(--ox-surface)',
              border: '1px solid var(--ox-line)',
              borderRadius: 6,
            }}
          >
            <Stat label="SESSIONS" value={sessions} />
            <Stat label="WEEKS IN" value={weeks} />
            <Stat label="CHECK-INS" value={checkins.length} accent="var(--ox-active)" />
          </div>
        </Section>

        {/* Quick actions */}
        <Section title="QUICK ACTIONS">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {QUICK.map((a) => (
              <div
                key={a.key}
                className="ox-tap"
                onClick={() => goQuick(a.key)}
                style={{
                  padding: 12,
                  background: a.accent ? 'var(--ox-red)' : 'var(--ox-elev)',
                  border: a.accent ? 'none' : '1px solid var(--ox-line)',
                  borderRadius: 6,
                  color: a.accent ? '#fff' : 'var(--ox-fg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  minHeight: 66,
                }}
              >
                <div style={{ fontSize: 18, opacity: 0.75 }}>{a.glyph}</div>
                <div className="ox-cap" style={{ color: 'inherit', fontSize: 9 }}>
                  {a.l}
                </div>
                <div
                  className="ox-thai"
                  style={{
                    fontSize: 10,
                    color: a.accent ? 'rgba(255,255,255,0.7)' : 'var(--ox-muted)',
                  }}
                >
                  {a.s}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Recent */}
        <Section
          title="RECENT · ล่าสุด"
          action={
            workouts.length > 0 && (
              <span
                className="ox-cap ox-tap"
                style={{ color: 'var(--ox-red)' }}
                onClick={() => navigate(`/client/${id}/history`)}
              >
                VIEW ALL
              </span>
            )
          }
        >
          {workouts.length === 0 ? (
            <div
              className="ox-card"
              style={{
                padding: 18,
                textAlign: 'center',
                color: 'var(--ox-dim)',
              }}
            >
              <div className="ox-thai" style={{ fontSize: 13 }}>
                ยังไม่มีบันทึกการเทรน
              </div>
            </div>
          ) : (
            <div className="ox-card" style={{ overflow: 'hidden' }}>
              {workouts.slice(0, 4).map((w, i, arr) => {
                const kind = workoutKind(w)
                return (
                  <div
                    key={w.id}
                    className="ox-tap"
                    onClick={() => navigate(`/client/${id}/workout/${w.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderBottom:
                        i < Math.min(arr.length, 4) - 1 ? '1px solid var(--ox-line)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 36,
                        background:
                          kind === 'weight' ? 'var(--ox-red)' : 'var(--ox-cardio)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ox-mono" style={{ fontSize: 9, color: 'var(--ox-dim)' }}>
                        {enDateLabel(w.date)}
                      </div>
                      <div
                        className="ox-thai ox-trunc"
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          marginTop: 2,
                        }}
                      >
                        {workoutTitle(w)}
                      </div>
                      <div
                        className="ox-thai ox-trunc"
                        style={{
                          fontSize: 10,
                          color: 'var(--ox-muted)',
                          marginTop: 2,
                        }}
                      >
                        {(w.exercises || []).map((e) => e.name).join(' · ') || '—'}
                      </div>
                    </div>
                    <span style={{ color: 'var(--ox-dim)' }}>›</span>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Latest check-in date */}
        {checkins.length > 0 && (
          <Section title="LATEST CHECK-IN">
            <div
              className="ox-tap ox-card"
              onClick={() => navigate(`/client/${id}/photos`)}
              style={{
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="ox-mono" style={{ fontSize: 13, fontWeight: 700 }}>
                  {shortDate(checkins[checkins.length - 1].date)}
                </div>
                <div className="ox-cap" style={{ color: 'var(--ox-dim)', marginTop: 3 }}>
                  {checkins.length} PROGRESS ENTRIES
                </div>
              </div>
              <span style={{ color: 'var(--ox-dim)' }}>›</span>
            </div>
          </Section>
        )}

        <div style={{ height: 16 }} />
      </div>

      <BottomNav active="clients" clientId={id} />

      {editing && (
        <TraineeSheet
          mode="edit"
          trainee={trainee}
          onClose={() => setEditing(false)}
          onSave={saveTrainee}
          onDelete={removeTrainee}
        />
      )}
      {busy && <BusyOverlay />}
    </div>
  )
}
